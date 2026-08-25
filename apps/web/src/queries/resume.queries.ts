import { useQuery } from '@tanstack/react-query';
import { getPublicResume, getResume } from '../api-client';

export const resumeQueryKeys = {
  all: ['resume'] as const,
  managed: () => [...resumeQueryKeys.all, 'managed'] as const,
  public: () => [...resumeQueryKeys.all, 'public'] as const,
};

export function useResume() {
  return useQuery({
    queryKey: resumeQueryKeys.managed(),
    queryFn: getResume,
  });
}

export function usePublicResume() {
  return useQuery({
    queryKey: resumeQueryKeys.public(),
    queryFn: getPublicResume,
  });
}
