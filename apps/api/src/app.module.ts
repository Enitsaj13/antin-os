import { Module } from '@nestjs/common';
import { AppController } from '@src/app.controller';
import { AppService } from '@src/app.service';
import { PrismaModule } from '@prisma/prisma.module';
import { HealthModule } from '@src/health/health.module';
import { ProjectsModule } from './projects/projects.module';
import { ProfileModule } from './profile/profile.module';
import { AuthModule } from './auth/auth.module';
import { ExperienceModule } from './experience/experience.module';

@Module({
  imports: [
    PrismaModule,
    HealthModule,
    AuthModule,
    ProjectsModule,
    ProfileModule,
    ExperienceModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
