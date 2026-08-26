import { useQuery } from '@tanstack/react-query';
import type { JobApplicationListFilter } from '@antin-os/shared';
import {
  getJobApplication,
  getJobApplicationDashboard,
  getJobApplications,
} from '../api-client';

export const jobApplicationQueryKeys = {
  all: ['job-applications'] as const,
  lists: () => [...jobApplicationQueryKeys.all, 'list'] as const,
  list: (filters: JobApplicationListFilter = {}) =>
    [
      ...jobApplicationQueryKeys.lists(),
      filters.status ?? 'all',
      filters.search?.trim() ?? '',
    ] as const,
  details: () => [...jobApplicationQueryKeys.all, 'detail'] as const,
  detail: (id: string) => [...jobApplicationQueryKeys.details(), id] as const,
  dashboard: () => [...jobApplicationQueryKeys.all, 'dashboard'] as const,
};

export function useJobApplications(filters: JobApplicationListFilter = {}) {
  return useQuery({
    queryKey: jobApplicationQueryKeys.list(filters),
    queryFn: () => getJobApplications(filters),
    retry: 1,
  });
}

export function useJobApplication(id: string) {
  return useQuery({
    queryKey: jobApplicationQueryKeys.detail(id),
    queryFn: () => getJobApplication(id),
    enabled: id.length > 0,
    retry: 1,
  });
}

export function useJobApplicationDashboard() {
  return useQuery({
    queryKey: jobApplicationQueryKeys.dashboard(),
    queryFn: getJobApplicationDashboard,
    retry: 1,
  });
}
