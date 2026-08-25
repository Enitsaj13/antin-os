export const RESUME_STORAGE = Symbol('RESUME_STORAGE');

export type UploadResumeInput = {
  body: Buffer;
  contentType: string;
};

export type StoredResume = {
  key: string;
};

export type DownloadedResume = {
  body: Buffer;
  contentType: string;
  contentLength?: number;
};

export interface ResumeStorage {
  upload(input: UploadResumeInput): Promise<StoredResume>;
  delete(key: string): Promise<void>;
  download(key: string): Promise<DownloadedResume>;
}
