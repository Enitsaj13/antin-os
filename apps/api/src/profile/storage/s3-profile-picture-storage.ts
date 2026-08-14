import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import {
  ProfilePictureStorage,
  StoredProfilePicture,
  UploadProfilePictureInput,
} from './profile-picture-storage';
import {
  getProfileStorageConfig,
  ProfileStorageConfig,
} from './profile-storage.config';

@Injectable()
export class S3ProfilePictureStorage implements ProfilePictureStorage {
  private config?: ProfileStorageConfig;
  private s3?: S3Client;

  async upload(
    input: UploadProfilePictureInput,
  ): Promise<StoredProfilePicture> {
    const key = `profile-pictures/${randomUUID()}.webp`;
    const { config, s3 } = this.getStorage();

    await s3.send(
      new PutObjectCommand({
        Bucket: config.bucket,
        Key: key,
        Body: input.body,
        ContentType: input.contentType,
      }),
    );

    return { key };
  }

  async delete(key: string): Promise<void> {
    const { config, s3 } = this.getStorage();

    await s3.send(
      new DeleteObjectCommand({
        Bucket: config.bucket,
        Key: key,
      }),
    );
  }

  async getUrl(key: string): Promise<string> {
    const { config, s3 } = this.getStorage();

    if (config.publicBaseUrl) {
      return `${config.publicBaseUrl.replace(/\/$/, '')}/${encodeURIComponent(key)}`;
    }

    return getSignedUrl(
      s3,
      new GetObjectCommand({
        Bucket: config.bucket,
        Key: key,
      }),
      { expiresIn: config.presignedUrlTtlSeconds },
    );
  }

  private getStorage(): { config: ProfileStorageConfig; s3: S3Client } {
    this.config ??= getProfileStorageConfig();
    this.s3 ??= new S3Client({
      region: this.config.region,
      credentials: {
        accessKeyId: this.config.accessKeyId,
        secretAccessKey: this.config.secretAccessKey,
      },
    });

    return { config: this.config, s3: this.s3 };
  }
}
