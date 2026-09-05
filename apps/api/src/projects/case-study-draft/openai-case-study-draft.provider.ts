import { Injectable } from '@nestjs/common';
import { AiDraftingError } from '@src/ai-drafting/ai-drafting.error';
import { OpenAiStructuredAiProvider } from '@src/ai-drafting/openai-structured-ai.provider';
import type { CaseStudyDraftConfig } from './case-study-draft.config';
import {
  CASE_STUDY_DRAFT_INSTRUCTIONS,
  caseStudyDraftJsonSchema,
  CaseStudyDraftProviderError,
  normalizeCaseStudyDraft,
} from './case-study-draft.provider';
import type {
  CaseStudyDraftProvider,
  CaseStudyDraftProviderInput,
} from './case-study-draft.provider';

@Injectable()
export class OpenAiCaseStudyDraftProvider implements CaseStudyDraftProvider {
  private readonly provider: OpenAiStructuredAiProvider;

  constructor(private readonly config: CaseStudyDraftConfig) {
    if (!config.openaiApiKey || !config.openaiModel) {
      throw new CaseStudyDraftProviderError(
        'configuration',
        'AI drafting configuration is incomplete.',
      );
    }

    this.provider = new OpenAiStructuredAiProvider(config);
  }

  async generate(input: CaseStudyDraftProviderInput) {
    try {
      const value = await this.provider.generate({
        schemaName: 'case_study_draft',
        schemaDescription:
          'Structured draft fields for a portfolio project case study.',
        schema: caseStudyDraftJsonSchema,
        instructions: CASE_STUDY_DRAFT_INSTRUCTIONS,
        serializedInput: JSON.stringify({
          project: input.project,
          ownerNotes: input.notes ?? '',
        }),
        maxOutputTokens: input.maxOutputTokens,
        signal: input.signal,
      });

      return normalizeCaseStudyDraft(value);
    } catch (error) {
      if (error instanceof CaseStudyDraftProviderError) {
        throw error;
      }

      if (error instanceof AiDraftingError) {
        throw new CaseStudyDraftProviderError(error.code, error.message);
      }

      throw new CaseStudyDraftProviderError(
        'provider',
        'AI provider could not generate a draft.',
      );
    }
  }
}
