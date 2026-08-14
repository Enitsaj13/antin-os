export const PROFILE_PICTURE_MAX_BYTES = 5 * 1024 * 1024;

export const PROFILE_PICTURE_SIZE = 512;

export const PROFILE_PICTURE_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
] as const;

export type ProfilePictureMimeType =
  (typeof PROFILE_PICTURE_MIME_TYPES)[number];
