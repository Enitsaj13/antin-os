import type { Experience as PrismaExperience } from '@prisma/client';
import type { Experience } from '@antin-os/shared';

export type ExperienceRecord = Pick<
  PrismaExperience,
  | 'id'
  | 'company'
  | 'role'
  | 'location'
  | 'employmentType'
  | 'startDate'
  | 'endDate'
  | 'isCurrent'
  | 'summary'
  | 'achievements'
  | 'technologies'
  | 'displayOrder'
  | 'isPublic'
  | 'createdAt'
  | 'updatedAt'
>;

export const experienceSelect = {
  id: true,
  company: true,
  role: true,
  location: true,
  employmentType: true,
  startDate: true,
  endDate: true,
  isCurrent: true,
  summary: true,
  achievements: true,
  technologies: true,
  displayOrder: true,
  isPublic: true,
  createdAt: true,
  updatedAt: true,
} as const;

export type ExperienceResponse = Experience;

export function toExperienceResponse(
  experience: ExperienceRecord,
): ExperienceResponse {
  return {
    ...experience,
    startDate: experience.startDate.toISOString(),
    endDate: experience.endDate?.toISOString() ?? null,
    createdAt: experience.createdAt.toISOString(),
    updatedAt: experience.updatedAt.toISOString(),
  };
}
