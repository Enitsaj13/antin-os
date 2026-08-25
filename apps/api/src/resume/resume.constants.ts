import { RESUME_MAX_BYTES } from '@antin-os/shared';

export const RESUME_SINGLETON_KEY = 'owner';
export const DEFAULT_RESUME_DOWNLOAD_FILENAME = 'Jastine-Formentera-CV.pdf';

export function getMaxResumeBytes(): number {
  const raw = process.env.RESUME_MAX_UPLOAD_BYTES;

  if (!raw) {
    return RESUME_MAX_BYTES;
  }

  const value = Number(raw);

  if (!Number.isInteger(value) || value <= 0) {
    throw new Error('RESUME_MAX_UPLOAD_BYTES must be a positive integer');
  }

  return value;
}
