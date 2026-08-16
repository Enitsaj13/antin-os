import {
  Body,
  Controller,
  Delete,
  Get,
  Post,
  Put,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { OwnerAuthGuard } from '@src/auth/owner-auth.guard';
import { memoryStorage } from 'multer';
import { MAX_PROFILE_PICTURE_BYTES } from './profile.constants';
import { UpsertProfileDto } from './dto/upsert-profile.dto';
import type { ProfileResponse } from './profile-response';
import { ProfileService } from './profile.service';

@Controller()
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  @Get('profile')
  @UseGuards(OwnerAuthGuard)
  getManagedProfile(): Promise<ProfileResponse> {
    return this.profileService.getManagedProfile();
  }

  @Put('profile')
  @UseGuards(OwnerAuthGuard)
  upsertProfile(@Body() dto: UpsertProfileDto): Promise<ProfileResponse> {
    return this.profileService.upsertProfile(dto);
  }

  @Post('profile/picture')
  @UseGuards(OwnerAuthGuard)
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
  @UseGuards(OwnerAuthGuard)
  removePicture(): Promise<ProfileResponse> {
    return this.profileService.removePicture();
  }

  @Get('public/profile')
  getPublicProfile(): Promise<ProfileResponse> {
    return this.profileService.getPublicProfile();
  }
}
