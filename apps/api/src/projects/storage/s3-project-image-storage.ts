import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type { ProjectImageUpload } from '@antin-os/shared';
import {
  CreateProjectImageUploadInput,
  ProjectImageStorage,
} from './project-image-storage';
import {
  getProjectImageStorageConfig,
  ProjectImageStorageConfig,
} from './project-image-storage.config';

const extensionByContentType: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

function encodeKeyPath(key: string) {
  return key.split('/').map(encodeURIComponent).join('/');
}

@Injectable()
export class S3ProjectImageStorage implements ProjectImageStorage {
  private config?: ProjectImageStorageConfig;
  private s3?: S3Client;

  async createUpload(
    input: CreateProjectImageUploadInput,
  ): Promise<ProjectImageUpload> {
    const { config, s3 } = this.getStorage();
    const extension = extensionByContentType[input.contentType] ?? 'webp';
    const key = `project-images/${randomUUID()}.${extension}`;

    const uploadUrl = await getSignedUrl(
      s3,
      new PutObjectCommand({
        Bucket: config.bucket,
        Key: key,
        ContentType: input.contentType,
      }),
      { expiresIn: config.presignedUrlTtlSeconds },
    );

    return {
      key,
      uploadUrl,
      imageUrl: await this.getUrl(key),
    };
  }

  async getUrl(key: string): Promise<string> {
    const { config, s3 } = this.getStorage();

    if (config.publicBaseUrl) {
      return `${config.publicBaseUrl.replace(/\/$/, '')}/${encodeKeyPath(key)}`;
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

  async delete(key: string): Promise<void> {
    const { config, s3 } = this.getStorage();

    await s3.send(
      new DeleteObjectCommand({
        Bucket: config.bucket,
        Key: key,
      }),
    );
  }

  private getStorage(): { config: ProjectImageStorageConfig; s3: S3Client } {
    this.config ??= getProjectImageStorageConfig();
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
