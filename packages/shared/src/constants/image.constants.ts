export const PROFILE_PICTURE_MAX_BYTES = 5 * 1024 * 1024;

export const PROFILE_PICTURE_SIZE = 512;

export const PROFILE_PICTURE_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
] as const;

export type ProfilePictureMimeType =
  (typeof PROFILE_PICTURE_MIME_TYPES)[number];

export const PROJECT_IMAGE_MAX_BYTES = 5 * 1024 * 1024;

export const PROJECT_IMAGE_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
] as const;

export const PROJECT_IMAGE_KEY_PATTERN =
  /^project-images\/[0-9a-f-]+\.(?:jpg|png|webp)$/;

export type ProjectImageMimeType = (typeof PROJECT_IMAGE_MIME_TYPES)[number];
