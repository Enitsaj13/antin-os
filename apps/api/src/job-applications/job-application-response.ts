import type {
  JobApplication as PrismaJobApplication,
  JobApplicationStatus as PrismaJobApplicationStatus,
} from '@prisma/client';
import type { JobApplication, JobApplicationStatus } from '@antin-os/shared';

export type JobApplicationRecord = Pick<
  PrismaJobApplication,
  | 'id'
  | 'company'
  | 'position'
  | 'jobUrl'
  | 'source'
  | 'salaryRange'
  | 'notes'
  | 'status'
  | 'applicationDate'
  | 'interviewDate'
  | 'nextActionDate'
  | 'followUpNotes'
  | 'createdAt'
  | 'updatedAt'
>;

export const jobApplicationSelect = {
  id: true,
  company: true,
  position: true,
  jobUrl: true,
  source: true,
  salaryRange: true,
  notes: true,
  status: true,
  applicationDate: true,
  interviewDate: true,
  nextActionDate: true,
  followUpNotes: true,
  createdAt: true,
  updatedAt: true,
} as const;

export type JobApplicationResponse = JobApplication;

export function toApiJobApplicationStatus(
  status: PrismaJobApplicationStatus,
): JobApplicationStatus {
  return status.toLowerCase() as JobApplicationStatus;
}

export function toJobApplicationResponse(
  application: JobApplicationRecord,
): JobApplicationResponse {
  return {
    ...application,
    status: toApiJobApplicationStatus(application.status),
    applicationDate: application.applicationDate?.toISOString() ?? null,
    interviewDate: application.interviewDate?.toISOString() ?? null,
    nextActionDate: application.nextActionDate?.toISOString() ?? null,
    createdAt: application.createdAt.toISOString(),
    updatedAt: application.updatedAt.toISOString(),
  };
}
