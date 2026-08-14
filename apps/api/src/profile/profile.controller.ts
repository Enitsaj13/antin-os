import {
  Body,
  Controller,
  Delete,
  Get,
  Post,
  Put,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { MAX_PROFILE_PICTURE_BYTES } from './profile.constants';
import { UpsertProfileDto } from './dto/upsert-profile.dto';
import type { ProfileResponse } from './profile-response';
import { ProfileService } from './profile.service';

@Controller()
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  @Get('profile')
  getManagedProfile(): Promise<ProfileResponse> {
    return this.profileService.getManagedProfile();
  }

  @Put('profile')
  upsertProfile(@Body() dto: UpsertProfileDto): Promise<ProfileResponse> {
    return this.profileService.upsertProfile(dto);
  }

  @Post('profile/picture')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: MAX_PROFILE_PICTURE_BYTES },
    }),
  )
  uploadPicture(
    @UploadedFile() file?: Express.Multer.File,
  ): Promise<ProfileResponse> {
    return this.profileService.uploadPicture(file);
  }

  @Delete('profile/picture')
  removePicture(): Promise<ProfileResponse> {
    return this.profileService.removePicture();
  }

  @Get('public/profile')
  getPublicProfile(): Promise<ProfileResponse> {
    return this.profileService.getPublicProfile();
  }
}
