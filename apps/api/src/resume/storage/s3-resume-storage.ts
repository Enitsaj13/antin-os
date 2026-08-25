import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type {
  DownloadedResume,
  ResumeStorage,
  StoredResume,
  UploadResumeInput,
} from './resume-storage';
import {
  getResumeStorageConfig,
  ResumeStorageConfig,
} from './resume-storage.config';

@Injectable()
export class S3ResumeStorage implements ResumeStorage {
  private config?: ResumeStorageConfig;
  private s3?: S3Client;

  async upload(input: UploadResumeInput): Promise<StoredResume> {
    const key = `resumes/${randomUUID()}.pdf`;
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

  async download(key: string): Promise<DownloadedResume> {
    const { config, s3 } = this.getStorage();
    const response = await s3.send(
      new GetObjectCommand({
        Bucket: config.bucket,
        Key: key,
      }),
    );

    const bytes = await response.Body?.transformToByteArray();

    return {
      body: Buffer.from(bytes ?? []),
      contentType: response.ContentType ?? 'application/pdf',
      contentLength: response.ContentLength,
    };
  }

  private getStorage(): { config: ResumeStorageConfig; s3: S3Client } {
    this.config ??= getResumeStorageConfig();
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
