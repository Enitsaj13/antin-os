import { Inject, Injectable } from '@nestjs/common';
import {
  AI_DRAFTING_CONFIG,
  type AiDraftingConfig,
} from './ai-drafting.config';
import { AiDraftingError } from './ai-drafting.error';
import { AiDraftingLimiter } from './ai-drafting.limiter';
import {
  STRUCTURED_AI_PROVIDER,
  type StructuredAiProvider,
} from './structured-ai.provider';

export type AiDraftingRequest<T> = {
  schemaName: string;
  schemaDescription: string;
  schema: Record<string, unknown>;
  instructions: string;
  input: unknown;
  normalize: (value: unknown) => T;
  createMock: () => T;
};

@Injectable()
export class AiDraftingService {
  constructor(
    @Inject(AI_DRAFTING_CONFIG)
    private readonly config: AiDraftingConfig,
    private readonly limiter: AiDraftingLimiter,
    @Inject(STRUCTURED_AI_PROVIDER)
    private readonly provider: StructuredAiProvider,
  ) {}

  ensureConfigured(): void {
    if (!this.config.enabled) {
      throw new AiDraftingError('disabled', 'AI drafting is disabled.');
    }

    if (this.config.errors.length > 0 || !this.config.provider) {
      throw new AiDraftingError(
        'configuration',
        'AI drafting configuration is incomplete.',
      );
    }
  }

  async generate<T>(request: AiDraftingRequest<T>): Promise<T> {
    this.ensureConfigured();

    const serializedInput = JSON.stringify(request.input);

    if (serializedInput.length > this.config.maxInputCharacters) {
      throw new AiDraftingError(
        'input-length',
        `AI drafting input must be ${this.config.maxInputCharacters} characters or fewer.`,
      );
    }

    const limitResult = this.limiter.consume(
      this.config.rateLimit,
      this.config.usageLimit,
    );

    if (limitResult === 'rate-limit') {
      throw new AiDraftingError(
        'rate-limit',
        'AI draft generation rate limit exceeded.',
      );
    }

    if (limitResult === 'usage-limit') {
      throw new AiDraftingError(
        'usage-limit',
        'AI draft generation usage limit exceeded.',
      );
    }

    if (this.config.provider === 'mock') {
      return request.normalize(request.createMock());
    }

    const abortController = new AbortController();
    const timeout = setTimeout(
      () => abortController.abort(),
      this.config.timeoutMs,
    );

    try {
      const value = await this.provider.generate({
        schemaName: request.schemaName,
        schemaDescription: request.schemaDescription,
        schema: request.schema,
        instructions: request.instructions,
        serializedInput,
        maxOutputTokens: this.config.maxOutputTokens,
        signal: abortController.signal,
      });

      try {
        return request.normalize(value);
      } catch (error) {
        if (error instanceof AiDraftingError) {
          throw error;
        }

        throw new AiDraftingError(
          'malformed',
          'AI provider returned malformed structured content.',
        );
      }
    } finally {
      clearTimeout(timeout);
    }
  }
}
