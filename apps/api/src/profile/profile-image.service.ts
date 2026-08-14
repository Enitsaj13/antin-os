import {
  BadRequestException,
  Injectable,
  PayloadTooLargeException,
  UnsupportedMediaTypeException,
} from '@nestjs/common';
import sharp from 'sharp';
import {
  MAX_PROFILE_PICTURE_BYTES,
  PROFILE_PICTURE_SIZE,
} from './profile.constants';

export type NormalizedProfilePicture = {
  body: Buffer;
  contentType: string;
};

const SUPPORTED_FORMATS = new Set(['jpeg', 'png', 'webp']);

@Injectable()
export class ProfileImageService {
  async normalize(
    file?: Express.Multer.File,
  ): Promise<NormalizedProfilePicture> {
    if (!file) {
      throw new BadRequestException('Profile picture file is required');
    }

    if (file.size === 0 || file.buffer.length === 0) {
      throw new BadRequestException('Profile picture file must not be empty');
    }

    if (file.size > MAX_PROFILE_PICTURE_BYTES) {
      throw new PayloadTooLargeException(
        'Profile picture must be 5 MB or smaller',
      );
    }

    const image = sharp(file.buffer, { failOn: 'error' });
    let metadata: sharp.Metadata;

    try {
      metadata = await image.metadata();
    } catch {
      throw new UnsupportedMediaTypeException(
        'Profile picture must be JPEG, PNG, or WebP',
      );
    }

    if (!metadata.format || !SUPPORTED_FORMATS.has(metadata.format)) {
      throw new UnsupportedMediaTypeException(
        'Profile picture must be JPEG, PNG, or WebP',
      );
    }

    if (
      !metadata.width ||
      !metadata.height ||
      metadata.width !== metadata.height
    ) {
      throw new BadRequestException(
        'Profile picture must be a square 1:1 image',
      );
    }

    const body = await sharp(file.buffer)
      .resize(PROFILE_PICTURE_SIZE, PROFILE_PICTURE_SIZE, { fit: 'fill' })
      .webp()
      .toBuffer();

    return {
      body,
      contentType: 'image/webp',
    };
  }
}
