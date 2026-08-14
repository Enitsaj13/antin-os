import { useQuery } from '@tanstack/react-query';
import { getProfile, getPublicProfile } from '../api-client';

export const profileQueryKeys = {
  all: ['profile'] as const,
  managed: () => [...profileQueryKeys.all, 'managed'] as const,
  public: () => [...profileQueryKeys.all, 'public'] as const,
};

export function useProfile() {
  return useQuery({
    queryKey: profileQueryKeys.managed(),
    queryFn: getProfile,
  });
}

export function usePublicProfile() {
  return useQuery({
    queryKey: profileQueryKeys.public(),
    queryFn: getPublicProfile,
  });
}
