export interface PortfolioSettings {
  id: string;
  singletonKey: string;
  showEducation: boolean;
  showCertifications: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UpdatePortfolioSettingsInput {
  showEducation?: boolean;
  showCertifications?: boolean;
}

export interface Education {
  id: string;
  institution: string;
  credential: string;
  fieldOfStudy: string;
  location: string;
  startDate: string | null;
  endDate: string | null;
  summary: string;
  displayOrder: number;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateEducationInput {
  institution: string;
  credential: string;
  fieldOfStudy: string;
  location: string;
  startDate?: string | null;
  endDate?: string | null;
  summary: string;
  displayOrder: number;
  isPublic?: boolean;
}

export type UpdateEducationInput = Partial<CreateEducationInput>;

export interface Certification {
  id: string;
  name: string;
  issuer: string;
  issueDate: string | null;
  expirationDate: string | null;
  credentialId: string | null;
  credentialUrl: string | null;
  summary: string;
  displayOrder: number;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCertificationInput {
  name: string;
  issuer: string;
  issueDate?: string | null;
  expirationDate?: string | null;
  credentialId?: string | null;
  credentialUrl?: string | null;
  summary: string;
  displayOrder: number;
  isPublic?: boolean;
}

export type UpdateCertificationInput = Partial<CreateCertificationInput>;

export interface ReorderCredentialItem {
  id: string;
  displayOrder: number;
}

export interface ReorderCredentialsInput {
  items: ReorderCredentialItem[];
}
