import type {
  PublicResume,
  Resume,
  UpdateResumePublicationInput,
} from '@antin-os/shared';
import {
  getApiBaseUrl,
  requestJson,
  requestNullableJson,
  uploadMultipart,
} from './http-client';

export function getResume(): Promise<Resume | null> {
  return requestNullableJson<Resume>('/resume');
}

export function uploadResume(input: {
  file: File | Blob;
  fileName: string;
  onProgress: (progress: number) => void;
}): Promise<Resume> {
  return uploadMultipart<Resume>(
    '/resume',
    'file',
    input.file,
    input.fileName,
    input.onProgress,
  );
}

export function updateResumePublication(
  input: UpdateResumePublicationInput,
): Promise<Resume> {
  return requestJson<Resume>('/resume/publication', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
}

export function deleteResume(): Promise<Resume> {
  return requestJson<Resume>('/resume', {
    method: 'DELETE',
  });
}

function toAbsoluteDownloadUrl(resume: PublicResume): PublicResume {
  if (/^https?:\/\//.test(resume.downloadUrl)) {
    return resume;
  }

  return {
    ...resume,
    downloadUrl: `${getApiBaseUrl()}${resume.downloadUrl}`,
  };
}

export async function getPublicResume(): Promise<PublicResume | null> {
  const resume = await requestNullableJson<PublicResume>('/public/resume');

  return resume ? toAbsoluteDownloadUrl(resume) : null;
}
