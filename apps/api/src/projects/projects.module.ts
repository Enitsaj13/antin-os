import { Module } from '@nestjs/common';
import { PrismaModule } from '@prisma/prisma.module';
import { AuthModule } from '@src/auth/auth.module';
import {
  CASE_STUDY_DRAFT_CONFIG,
  getCaseStudyDraftConfig,
} from './case-study-draft/case-study-draft.config';
import type { CaseStudyDraftConfig } from './case-study-draft/case-study-draft.config';
import { CaseStudyDraftLimiter } from './case-study-draft/case-study-draft.limiter';
import { CASE_STUDY_DRAFT_PROVIDER } from './case-study-draft/case-study-draft.provider';
import { MockCaseStudyDraftProvider } from './case-study-draft/mock-case-study-draft.provider';
import { OpenAiCaseStudyDraftProvider } from './case-study-draft/openai-case-study-draft.provider';
import { ProjectsController } from './projects.controller';
import { ProjectsService } from './projects.service';
import { PROJECT_IMAGE_STORAGE } from './storage/project-image-storage';
import { S3ProjectImageStorage } from './storage/s3-project-image-storage';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [ProjectsController],
  providers: [
    ProjectsService,
    CaseStudyDraftLimiter,
    {
      provide: CASE_STUDY_DRAFT_CONFIG,
      useFactory: getCaseStudyDraftConfig,
    },
    {
      provide: CASE_STUDY_DRAFT_PROVIDER,
      inject: [CASE_STUDY_DRAFT_CONFIG],
      useFactory: (config: CaseStudyDraftConfig) => {
        if (
          config.provider === 'openai' &&
          config.openaiApiKey &&
          config.openaiModel
        ) {
          return new OpenAiCaseStudyDraftProvider(config);
        }

        return new MockCaseStudyDraftProvider();
      },
    },
    {
      provide: PROJECT_IMAGE_STORAGE,
      useClass: S3ProjectImageStorage,
    },
  ],
})
export class ProjectsModule {}
