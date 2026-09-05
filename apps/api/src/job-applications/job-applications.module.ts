import { Module } from '@nestjs/common';
import { PrismaModule } from '@prisma/prisma.module';
import { AiDraftingModule } from '@src/ai-drafting/ai-drafting.module';
import { AuthModule } from '@src/auth/auth.module';
import { JobApplicationsController } from './job-applications.controller';
import { JobApplicationAssistantService } from './job-assistant/job-application-assistant.service';
import { JobApplicationsService } from './job-applications.service';

@Module({
  imports: [PrismaModule, AuthModule, AiDraftingModule],
  controllers: [JobApplicationsController],
  providers: [JobApplicationsService, JobApplicationAssistantService],
})
export class JobApplicationsModule {}
