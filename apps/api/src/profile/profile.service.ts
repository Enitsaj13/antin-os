import {
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '@prisma/prisma.service';
import { PROFILE_SINGLETON_KEY } from './profile.constants';
import { UpsertProfileDto } from './dto/upsert-profile.dto';
import {
  ProfileRecord,
  ProfileResponse,
  profileSelect,
} from './profile-response';
import { ProfileImageService } from './profile-image.service';
import { PROFILE_PICTURE_STORAGE } from './storage/profile-picture-storage';
import type { ProfilePictureStorage } from './storage/profile-picture-storage';

@Injectable()
export class ProfileService {
  private readonly logger = new Logger(ProfileService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly imageService: ProfileImageService,
    @Inject(PROFILE_PICTURE_STORAGE)
    private readonly storage: ProfilePictureStorage,
  ) {}

  async getManagedProfile(): Promise<ProfileResponse> {
    return this.toResponse(await this.requireProfile());
  }

  async getPublicProfile(): Promise<ProfileResponse> {
    return this.getManagedProfile();
  }

  async upsertProfile(dto: UpsertProfileDto): Promise<ProfileResponse> {
    const profile = await this.prisma.profile.upsert({
      where: { singletonKey: PROFILE_SINGLETON_KEY },
      create: {
        singletonKey: PROFILE_SINGLETON_KEY,
        fullName: dto.fullName,
        headline: dto.headline,
        biography: dto.biography,
        location: dto.location,
        email: dto.email,
        githubUrl: dto.githubUrl,
        linkedinUrl: dto.linkedinUrl,
      },
      update: {
        fullName: dto.fullName,
        headline: dto.headline,
        biography: dto.biography,
        location: dto.location,
        email: dto.email,
        githubUrl: dto.githubUrl,
        linkedinUrl: dto.linkedinUrl,
      },
      select: profileSelect,
    });

    return this.toResponse(profile);
  }

  async uploadPicture(file?: Express.Multer.File): Promise<ProfileResponse> {
    const existing = await this.requireProfile();
    const normalized = await this.imageService.normalize(file);
    const uploaded = await this.storage.upload(normalized);

    let updated: ProfileRecord;

    try {
      updated = await this.prisma.profile.update({
        where: { singletonKey: PROFILE_SINGLETON_KEY },
        data: { profilePictureKey: uploaded.key },
        select: profileSelect,
      });
    } catch (error) {
      await this.deleteUploadedAfterFailure(uploaded.key);
      throw error;
    }

    if (existing.profilePictureKey) {
      await this.deletePreviousAfterReplacement(existing.profilePictureKey);
    }

    return this.toResponse(updated);
  }

  async removePicture(): Promise<ProfileResponse> {
    const existing = await this.requireProfile();

    if (!existing.profilePictureKey) {
      return this.toResponse(existing);
    }

    const updated = await this.prisma.profile.update({
      where: { singletonKey: PROFILE_SINGLETON_KEY },
      data: { profilePictureKey: null },
      select: profileSelect,
    });

    await this.storage.delete(existing.profilePictureKey);

    return this.toResponse(updated);
  }

  private async requireProfile(): Promise<ProfileRecord> {
    const profile = await this.prisma.profile.findUnique({
      where: { singletonKey: PROFILE_SINGLETON_KEY },
      select: profileSelect,
    });

    if (!profile) {
      throw new NotFoundException('Profile not found');
    }

    return profile;
  }

  private async toResponse(profile: ProfileRecord): Promise<ProfileResponse> {
    const { profilePictureKey, ...response } = profile;

    return {
      ...response,
      createdAt: response.createdAt.toISOString(),
      updatedAt: response.updatedAt.toISOString(),
      profilePictureUrl: profilePictureKey
        ? await this.storage.getUrl(profilePictureKey)
        : null,
    };
  }

  private async deleteUploadedAfterFailure(key: string): Promise<void> {
    try {
      await this.storage.delete(key);
    } catch (error) {
      this.logger.error(
        'Failed to clean up newly uploaded profile picture',
        error,
      );
      throw new InternalServerErrorException(
        'Failed to clean up profile picture',
      );
    }
  }

  private async deletePreviousAfterReplacement(key: string): Promise<void> {
    try {
      await this.storage.delete(key);
    } catch (error) {
      this.logger.error('Failed to delete previous profile picture', error);
    }
  }
}
