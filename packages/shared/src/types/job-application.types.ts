import type { JobApplicationStatus } from '../constants/job-application.constants';

export interface JobApplication {
  id: string;
  company: string;
  position: string;
  jobUrl: string | null;
  source: string | null;
  salaryRange: string | null;
  notes: string | null;
  status: JobApplicationStatus;
  applicationDate: string | null;
  interviewDate: string | null;
  nextActionDate: string | null;
  followUpNotes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateJobApplicationInput {
  company: string;
  position: string;
  jobUrl?: string | null;
  source?: string | null;
  salaryRange?: string | null;
  notes?: string | null;
  status?: JobApplicationStatus;
  applicationDate?: string | null;
  interviewDate?: string | null;
  nextActionDate?: string | null;
  followUpNotes?: string | null;
}

export type UpdateJobApplicationInput = Partial<CreateJobApplicationInput>;

export interface JobApplicationListFilter {
  status?: JobApplicationStatus;
  search?: string;
}

export interface JobApplicationDashboardSummary {
  total: number;
  counts: Record<JobApplicationStatus, number>;
}
