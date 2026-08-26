import type {
  CreateJobApplicationInput,
  JobApplication,
  JobApplicationDashboardSummary,
  JobApplicationListFilter,
  UpdateJobApplicationInput,
} from '@antin-os/shared';
import { requestJson } from './http-client';

export function createJobApplication(
  input: CreateJobApplicationInput,
): Promise<JobApplication> {
  return requestJson<JobApplication>('/job-applications', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
}

export function getJobApplications(
  filters: JobApplicationListFilter = {},
): Promise<JobApplication[]> {
  const params = new URLSearchParams();

  if (filters.status) {
    params.set('status', filters.status);
  }

  if (filters.search?.trim()) {
    params.set('search', filters.search.trim());
  }

  const query = params.toString();
  return requestJson<JobApplication[]>(
    `/job-applications${query ? `?${query}` : ''}`,
  );
}

export function getJobApplication(id: string): Promise<JobApplication> {
  return requestJson<JobApplication>(
    `/job-applications/${encodeURIComponent(id)}`,
  );
}

export function getJobApplicationDashboard(): Promise<JobApplicationDashboardSummary> {
  return requestJson<JobApplicationDashboardSummary>(
    '/job-applications/dashboard',
  );
}

export function updateJobApplication(
  id: string,
  input: UpdateJobApplicationInput,
): Promise<JobApplication> {
  return requestJson<JobApplication>(
    `/job-applications/${encodeURIComponent(id)}`,
    {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    },
  );
}

export function deleteJobApplication(id: string): Promise<JobApplication> {
  return requestJson<JobApplication>(
    `/job-applications/${encodeURIComponent(id)}`,
    { method: 'DELETE' },
  );
}
