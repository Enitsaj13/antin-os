import { Module } from '@nestjs/common';
import { AppController } from '@src/app.controller';
import { AppService } from '@src/app.service';
import { PrismaModule } from '@prisma/prisma.module';
import { HealthModule } from '@src/health/health.module';
import { ProjectsModule } from './projects/projects.module';
import { ProfileModule } from './profile/profile.module';

@Module({
  imports: [PrismaModule, HealthModule, ProjectsModule, ProfileModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
