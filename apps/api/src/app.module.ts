import { Module } from '@nestjs/common';
import { AppController } from '@src/app.controller';
import { AppService } from '@src/app.service';
import { PrismaModule } from '@prisma/prisma.module';
import { HealthModule } from '@src/health/health.module';
import { ProjectsModule } from './projects/projects.module';
import { ProfileModule } from './profile/profile.module';
import { AuthModule } from './auth/auth.module';
import { ExperienceModule } from './experience/experience.module';
import { ResumeModule } from './resume/resume.module';
import { CredentialsModule } from './credentials/credentials.module';
import { JobApplicationsModule } from './job-applications/job-applications.module';

@Module({
  imports: [
    PrismaModule,
    HealthModule,
    AuthModule,
    ProjectsModule,
    ProfileModule,
    ExperienceModule,
    ResumeModule,
    CredentialsModule,
    JobApplicationsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
