import type {
  Certification as PrismaCertification,
  Education as PrismaEducation,
  PortfolioSettings as PrismaPortfolioSettings,
} from '@prisma/client';
import type {
  Certification,
  Education,
  PortfolioSettings,
} from '@antin-os/shared';

export type PortfolioSettingsRecord = Pick<
  PrismaPortfolioSettings,
  | 'id'
  | 'singletonKey'
  | 'showEducation'
  | 'showCertifications'
  | 'createdAt'
  | 'updatedAt'
>;

export type EducationRecord = Pick<
  PrismaEducation,
  | 'id'
  | 'institution'
  | 'credential'
  | 'fieldOfStudy'
  | 'location'
  | 'startDate'
  | 'endDate'
  | 'summary'
  | 'displayOrder'
  | 'isPublic'
  | 'createdAt'
  | 'updatedAt'
>;

export type CertificationRecord = Pick<
  PrismaCertification,
  | 'id'
  | 'name'
  | 'issuer'
  | 'issueDate'
  | 'expirationDate'
  | 'credentialId'
  | 'credentialUrl'
  | 'summary'
  | 'displayOrder'
  | 'isPublic'
  | 'createdAt'
  | 'updatedAt'
>;

export const portfolioSettingsSelect = {
  id: true,
  singletonKey: true,
  showEducation: true,
  showCertifications: true,
  createdAt: true,
  updatedAt: true,
} as const;

export const educationSelect = {
  id: true,
  institution: true,
  credential: true,
  fieldOfStudy: true,
  location: true,
  startDate: true,
  endDate: true,
  summary: true,
  displayOrder: true,
  isPublic: true,
  createdAt: true,
  updatedAt: true,
} as const;

export const certificationSelect = {
  id: true,
  name: true,
  issuer: true,
  issueDate: true,
  expirationDate: true,
  credentialId: true,
  credentialUrl: true,
  summary: true,
  displayOrder: true,
  isPublic: true,
  createdAt: true,
  updatedAt: true,
} as const;

export type PortfolioSettingsResponse = PortfolioSettings;
export type EducationResponse = Education;
export type CertificationResponse = Certification;

export function toPortfolioSettingsResponse(
  settings: PortfolioSettingsRecord,
): PortfolioSettingsResponse {
  return {
    ...settings,
    createdAt: settings.createdAt.toISOString(),
    updatedAt: settings.updatedAt.toISOString(),
  };
}

export function toEducationResponse(
  education: EducationRecord,
): EducationResponse {
  return {
    ...education,
    startDate: education.startDate?.toISOString() ?? null,
    endDate: education.endDate?.toISOString() ?? null,
    createdAt: education.createdAt.toISOString(),
    updatedAt: education.updatedAt.toISOString(),
  };
}

export function toCertificationResponse(
  certification: CertificationRecord,
): CertificationResponse {
  return {
    ...certification,
    issueDate: certification.issueDate?.toISOString() ?? null,
    expirationDate: certification.expirationDate?.toISOString() ?? null,
    createdAt: certification.createdAt.toISOString(),
    updatedAt: certification.updatedAt.toISOString(),
  };
}
