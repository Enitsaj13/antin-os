import { Inject, Injectable, Logger } from '@nestjs/common';
import OpenAI from 'openai';
import {
  AI_DRAFTING_CONFIG,
  type AiDraftingConfig,
} from './ai-drafting.config';
import { AiDraftingError } from './ai-drafting.error';
import type {
  StructuredAiProvider,
  StructuredAiProviderRequest,
} from './structured-ai.provider';

function safeLogValue(value: unknown): string | undefined {
  if (typeof value === 'string') {
    return value.slice(0, 200);
  }

  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }

  return undefined;
}

function openAiErrorDetails(error: unknown): Record<string, string> {
  const record = error as Record<string, unknown>;

  return {
    status: safeLogValue(record.status) ?? 'unknown',
    code: safeLogValue(record.code) ?? 'unknown',
    type: safeLogValue(record.type) ?? 'unknown',
    requestId: safeLogValue(record.request_id) ?? 'unknown',
  };
}

@Injectable()
export class OpenAiStructuredAiProvider implements StructuredAiProvider {
  private readonly logger = new Logger(OpenAiStructuredAiProvider.name);
  private client?: OpenAI;

  constructor(
    @Inject(AI_DRAFTING_CONFIG)
    private readonly config: AiDraftingConfig,
  ) {}

  async generate(request: StructuredAiProviderRequest): Promise<unknown> {
    if (!this.config.openaiApiKey || !this.config.openaiModel) {
      throw new AiDraftingError(
        'configuration',
        'AI drafting configuration is incomplete.',
      );
    }

    this.client ??= new OpenAI({ apiKey: this.config.openaiApiKey });

    try {
      const response = await this.client.responses.create(
        {
          model: this.config.openaiModel,
          instructions: request.instructions,
          input: request.serializedInput,
          max_output_tokens: request.maxOutputTokens,
          store: false,
          text: {
            format: {
              type: 'json_schema',
              name: request.schemaName,
              description: request.schemaDescription,
              strict: true,
              schema: request.schema,
            },
          },
        },
        { signal: request.signal },
      );

      if (response.error || response.status === 'failed') {
        this.logger.error('OpenAI structured generation failed', {
          model: this.config.openaiModel,
          schemaName: request.schemaName,
          status: response.status,
          code: safeLogValue(response.error?.code) ?? 'unknown',
        });
        throw new AiDraftingError(
          'provider',
          'AI provider could not generate structured content.',
        );
      }

      if (response.status === 'incomplete' || response.incomplete_details) {
        this.logger.warn('OpenAI structured generation incomplete', {
          model: this.config.openaiModel,
          schemaName: request.schemaName,
          status: response.status,
          reason:
            safeLogValue(response.incomplete_details?.reason) ?? 'unknown',
        });
        throw new AiDraftingError(
          'malformed',
          'AI provider returned incomplete structured content.',
        );
      }

      if (!response.output_text) {
        this.logger.warn('OpenAI structured generation returned no output', {
          model: this.config.openaiModel,
          schemaName: request.schemaName,
          status: response.status,
          outputItems: String(response.output?.length ?? 0),
        });
        throw new AiDraftingError(
          'malformed',
          'AI provider returned malformed structured content.',
        );
      }

      try {
        return JSON.parse(response.output_text) as unknown;
      } catch {
        this.logger.warn('OpenAI structured generation returned invalid JSON', {
          model: this.config.openaiModel,
          schemaName: request.schemaName,
          status: response.status,
          outputLength: String(response.output_text.length),
        });
        throw new AiDraftingError(
          'malformed',
          'AI provider returned malformed structured content.',
        );
      }
    } catch (error) {
      if (error instanceof AiDraftingError) {
        throw error;
      }

      if (error instanceof Error && error.name === 'AbortError') {
        this.logger.warn('OpenAI structured generation timed out', {
          model: this.config.openaiModel,
          schemaName: request.schemaName,
        });
        throw new AiDraftingError('timeout', 'AI provider timed out.');
      }

      this.logger.error('OpenAI structured generation request failed', {
        model: this.config.openaiModel,
        schemaName: request.schemaName,
        ...openAiErrorDetails(error),
      });
      throw new AiDraftingError(
        'provider',
        'AI provider could not generate structured content.',
      );
    }
  }
}
