import { Module } from '@nestjs/common';
import { PrismaModule } from '@prisma/prisma.module';
import { AuthModule } from '@src/auth/auth.module';
import { ProjectsController } from './projects.controller';
import { ProjectsService } from './projects.service';
import { PROJECT_IMAGE_STORAGE } from './storage/project-image-storage';
import { S3ProjectImageStorage } from './storage/s3-project-image-storage';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [ProjectsController],
  providers: [
    ProjectsService,
    {
      provide: PROJECT_IMAGE_STORAGE,
      useClass: S3ProjectImageStorage,
    },
  ],
})
export class ProjectsModule {}
