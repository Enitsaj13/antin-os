import { Module } from '@nestjs/common';
import { PrismaModule } from '@prisma/prisma.module';
import { ProfileController } from './profile.controller';
import { ProfileImageService } from './profile-image.service';
import { ProfileService } from './profile.service';
import { PROFILE_PICTURE_STORAGE } from './storage/profile-picture-storage';
import { S3ProfilePictureStorage } from './storage/s3-profile-picture-storage';

@Module({
  imports: [PrismaModule],
  controllers: [ProfileController],
  providers: [
    ProfileImageService,
    ProfileService,
    {
      provide: PROFILE_PICTURE_STORAGE,
      useClass: S3ProfilePictureStorage,
    },
  ],
})
export class ProfileModule {}
