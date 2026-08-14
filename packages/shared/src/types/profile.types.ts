export interface Profile {
  id: string;
  fullName: string;
  headline: string;
  biography: string;
  location: string;
  email: string;
  githubUrl: string | null;
  linkedinUrl: string | null;
  profilePictureUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface UpsertProfileInput {
  fullName: string;
  headline: string;
  biography: string;
  location: string;
  email: string;
  githubUrl?: string | null;
  linkedinUrl?: string | null;
}

export type ProfileFormValues = UpsertProfileInput;
