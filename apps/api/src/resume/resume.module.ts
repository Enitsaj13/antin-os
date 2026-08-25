import { Module } from '@nestjs/common';
import { PrismaModule } from '@prisma/prisma.module';
import { AuthModule } from '@src/auth/auth.module';
import { ResumeController } from './resume.controller';
import { ResumeFileService } from './resume-file.service';
import { ResumeService } from './resume.service';
import { RESUME_STORAGE } from './storage/resume-storage';
import { S3ResumeStorage } from './storage/s3-resume-storage';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [ResumeController],
  providers: [
    ResumeFileService,
    ResumeService,
    {
      provide: RESUME_STORAGE,
      useClass: S3ResumeStorage,
    },
  ],
})
export class ResumeModule {}
