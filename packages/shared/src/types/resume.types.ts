export interface Resume {
  id: string;
  originalFilename: string;
  fileSize: number;
  contentType: string;
  isPublic: boolean;
  uploadedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface PublicResume {
  id: string;
  originalFilename: string;
  fileSize: number;
  contentType: string;
  isPublic: true;
  uploadedAt: string;
  updatedAt: string;
  downloadUrl: string;
}

export interface UpdateResumePublicationInput {
  isPublic: boolean;
}
