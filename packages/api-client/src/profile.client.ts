import type { Profile, UpsertProfileInput } from '@antin-os/shared';
import {
  requestJson,
  requestNullableJson,
  uploadMultipart,
} from './http-client';

export function getProfile(): Promise<Profile | null> {
  return requestNullableJson<Profile>('/profile');
}

export function saveProfile(input: UpsertProfileInput): Promise<Profile> {
  return requestJson<Profile>('/profile', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
}

export function uploadProfilePicture(
  file: Blob,
  onProgress: (progress: number) => void,
): Promise<Profile> {
  return uploadMultipart<Profile>(
    '/profile/picture',
    'file',
    file,
    'profile-picture.webp',
    onProgress,
  );
}

export function removeProfilePicture(): Promise<Profile> {
  return requestJson<Profile>('/profile/picture', {
    method: 'DELETE',
  });
}

export function getPublicProfile(): Promise<Profile | null> {
  return requestNullableJson<Profile>('/public/profile');
}
