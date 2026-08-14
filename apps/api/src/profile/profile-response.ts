import type { Profile } from '@prisma/client';
import type { Profile as SharedProfile } from '@antin-os/shared';

export type ProfileRecord = Pick<
  Profile,
  | 'id'
  | 'fullName'
  | 'headline'
  | 'biography'
  | 'location'
  | 'email'
  | 'githubUrl'
  | 'linkedinUrl'
  | 'profilePictureKey'
  | 'createdAt'
  | 'updatedAt'
>;

export type ProfileResponse = SharedProfile;

export const profileSelect = {
  id: true,
  fullName: true,
  headline: true,
  biography: true,
  location: true,
  email: true,
  githubUrl: true,
  linkedinUrl: true,
  profilePictureKey: true,
  createdAt: true,
  updatedAt: true,
} as const;
