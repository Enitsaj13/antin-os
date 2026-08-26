import { Injectable, Logger } from '@nestjs/common';
import OpenAI from 'openai';
import type { CaseStudyDraftConfig } from './case-study-draft.config';
import {
  caseStudyDraftJsonSchema,
  CaseStudyDraftProviderError,
  normalizeCaseStudyDraft,
} from './case-study-draft.provider';
import type {
  CaseStudyDraftProvider,
  CaseStudyDraftProviderInput,
} from './case-study-draft.provider';

function safeJsonParse(value: string): unknown {
  try {
    return JSON.parse(value) as unknown;
  } catch {
    throw new CaseStudyDraftProviderError(
      'malformed',
      'AI provider returned malformed draft content.',
    );
  }
}

function safeLogValue(value: unknown): string | undefined {
  if (typeof value === 'string') {
    return value.slice(0, 500);
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
    message:
      error instanceof Error
        ? error.message.slice(0, 500)
        : safeLogValue(error) ?? 'Unknown OpenAI provider error',
  };
}

@Injectable()
export class OpenAiCaseStudyDraftProvider implements CaseStudyDraftProvider {
  private readonly logger = new Logger(OpenAiCaseStudyDraftProvider.name);
  private readonly client: OpenAI;

  constructor(private readonly config: CaseStudyDraftConfig) {
    if (!config.openaiApiKey || !config.openaiModel) {
      throw new CaseStudyDraftProviderError(
        'configuration',
        'AI drafting configuration is incomplete.',
      );
    }

    this.client = new OpenAI({ apiKey: config.openaiApiKey });
  }

  async generate(input: CaseStudyDraftProviderInput) {
    if (!this.config.openaiModel) {
      throw new CaseStudyDraftProviderError(
        'configuration',
        'AI drafting configuration is incomplete.',
      );
    }

    try {
      const response = await this.client.responses.create(
        {
          model: this.config.openaiModel,
          instructions: [
            'Generate a recruiter-readable project case-study draft.',
            'Use only the provided project fields and optional owner notes.',
            'Do not invent metrics, responsibilities, technologies, business outcomes, dates, clients, employers, or credentials.',
            'Keep role as a short title only, such as "Full-stack Developer" or "Software Engineer - Mobile & Web"; do not include responsibilities, portals, technologies, or explanatory sentences in role.',
            'Put responsibility details in responsibilities, context, or approach instead of role.',
            'Always provide lessonsLearned as a recruiter-readable reflective paragraph of 2 to 4 sentences.',
            'Base lessonsLearned on confirmed project role, stack, workflow, architecture, collaboration, QA, delivery, or engineering practices.',
            'Prefer specific engineering takeaways over generic statements; for example, connect multi-portal work to shared contracts, consistent validation, source-of-truth decisions, release discipline, or verification when those ideas are supported by the provided data.',
            'If the lesson is inferred rather than directly stated, keep it conservative and add a needsConfirmation item.',
            'Never return null or an empty string for lessonsLearned.',
            'If information is missing or uncertain, omit it or add a concise needsConfirmation item.',
            'Return only strict JSON that matches the provided schema.',
          ].join(' '),
          input: JSON.stringify({
            project: input.project,
            ownerNotes: input.notes ?? '',
          }),
          max_output_tokens: input.maxOutputTokens,
          store: false,
          text: {
            format: {
              type: 'json_schema',
              name: 'case_study_draft',
              description:
                'Structured draft fields for a portfolio project case study.',
              strict: true,
              schema: caseStudyDraftJsonSchema,
            },
          },
        },
        { signal: input.signal },
      );

      if (response.error || response.status === 'failed') {
        this.logger.error('OpenAI case-study draft generation failed', {
          model: this.config.openaiModel,
          status: response.status,
          code: safeLogValue(response.error?.code) ?? 'unknown',
          message: safeLogValue(response.error?.message) ?? 'unknown',
        });
        throw new CaseStudyDraftProviderError(
          'provider',
          'AI provider could not generate a draft.',
        );
      }

      if (response.status === 'incomplete' || response.incomplete_details) {
        this.logger.warn('OpenAI case-study draft generation incomplete', {
          model: this.config.openaiModel,
          status: response.status,
          reason:
            safeLogValue(response.incomplete_details?.reason) ?? 'unknown',
        });
        throw new CaseStudyDraftProviderError(
          'malformed',
          'AI provider returned an incomplete draft.',
        );
      }

      if (!response.output_text) {
        this.logger.warn('OpenAI case-study draft returned no output text', {
          model: this.config.openaiModel,
          status: response.status,
          outputItems: String(response.output?.length ?? 0),
        });
        throw new CaseStudyDraftProviderError(
          'malformed',
          'AI provider returned malformed draft content.',
        );
      }

      try {
        return normalizeCaseStudyDraft(safeJsonParse(response.output_text));
      } catch (error) {
        if (error instanceof CaseStudyDraftProviderError) {
          this.logger.warn('OpenAI case-study draft normalization failed', {
            model: this.config.openaiModel,
            status: response.status,
            outputLength: String(response.output_text.length),
            code: error.code,
          });
        }

        throw error;
      }
    } catch (error) {
      if (error instanceof CaseStudyDraftProviderError) {
        throw error;
      }

      if (error instanceof Error && error.name === 'AbortError') {
        this.logger.warn('OpenAI case-study draft timed out', {
          model: this.config.openaiModel,
        });
        throw new CaseStudyDraftProviderError(
          'timeout',
          'AI provider timed out.',
        );
      }

      this.logger.error('OpenAI case-study draft request failed', {
        model: this.config.openaiModel,
        ...openAiErrorDetails(error),
      });

      throw new CaseStudyDraftProviderError(
        'provider',
        'AI provider could not generate a draft.',
      );
    }
  }
}
