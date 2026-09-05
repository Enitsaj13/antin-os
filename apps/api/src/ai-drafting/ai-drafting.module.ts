import { Global, Module } from '@nestjs/common';
import { AI_DRAFTING_CONFIG, getAiDraftingConfig } from './ai-drafting.config';
import { AiDraftingLimiter } from './ai-drafting.limiter';
import { AiDraftingService } from './ai-drafting.service';
import { OpenAiStructuredAiProvider } from './openai-structured-ai.provider';
import { STRUCTURED_AI_PROVIDER } from './structured-ai.provider';

@Global()
@Module({
  providers: [
    {
      provide: AI_DRAFTING_CONFIG,
      useFactory: getAiDraftingConfig,
    },
    AiDraftingLimiter,
    OpenAiStructuredAiProvider,
    {
      provide: STRUCTURED_AI_PROVIDER,
      useExisting: OpenAiStructuredAiProvider,
    },
    AiDraftingService,
  ],
  exports: [AI_DRAFTING_CONFIG, AiDraftingLimiter, AiDraftingService],
})
export class AiDraftingModule {}
