import { useQuery } from '@tanstack/react-query';
import { getAdminSession } from '../api-client';

export const authQueryKeys = {
  session: ['auth', 'session'] as const,
};

export function useAdminSession(enabled = true) {
  return useQuery({
    queryKey: authQueryKeys.session,
    queryFn: getAdminSession,
    enabled,
    retry: false,
  });
}
