import type { ProjectImageUpload } from '@antin-os/shared';

export type CreateProjectImageUploadInput = {
  fileName: string;
  contentType: string;
};

export interface ProjectImageStorage {
  createUpload(
    input: CreateProjectImageUploadInput,
  ): Promise<ProjectImageUpload>;
  getUrl(key: string): Promise<string>;
  delete(key: string): Promise<void>;
}

export const PROJECT_IMAGE_STORAGE = Symbol('PROJECT_IMAGE_STORAGE');
