import type { PublicResume, Resume } from '@antin-os/shared';
import type { Resume as ResumeRecord } from '@prisma/client';
import { PUBLIC_RESUME_DOWNLOAD_PATH } from '@antin-os/shared';

export type { ResumeRecord };

export const resumeSelect = {
  id: true,
  singletonKey: true,
  originalFilename: true,
  fileSize: true,
  contentType: true,
  objectKey: true,
  isPublic: true,
  uploadedAt: true,
  createdAt: true,
  updatedAt: true,
} satisfies Record<keyof ResumeRecord, true>;

export function toResumeResponse(resume: ResumeRecord): Resume {
  return {
    id: resume.id,
    originalFilename: resume.originalFilename,
    fileSize: resume.fileSize,
    contentType: resume.contentType,
    isPublic: resume.isPublic,
    uploadedAt: resume.uploadedAt.toISOString(),
    createdAt: resume.createdAt.toISOString(),
    updatedAt: resume.updatedAt.toISOString(),
  };
}

export function toPublicResumeResponse(resume: ResumeRecord): PublicResume {
  return {
    id: resume.id,
    originalFilename: resume.originalFilename,
    fileSize: resume.fileSize,
    contentType: resume.contentType,
    isPublic: true,
    uploadedAt: resume.uploadedAt.toISOString(),
    updatedAt: resume.updatedAt.toISOString(),
    downloadUrl: PUBLIC_RESUME_DOWNLOAD_PATH,
  };
}
