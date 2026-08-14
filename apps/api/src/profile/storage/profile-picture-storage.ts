export type StoredProfilePicture = {
  key: string;
};

export type UploadProfilePictureInput = {
  body: Buffer;
  contentType: string;
};

export interface ProfilePictureStorage {
  upload(input: UploadProfilePictureInput): Promise<StoredProfilePicture>;
  delete(key: string): Promise<void>;
  getUrl(key: string): Promise<string>;
}

export const PROFILE_PICTURE_STORAGE = Symbol('PROFILE_PICTURE_STORAGE');
