import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { AdminLoginInput } from '@antin-os/shared';
import { loginAdmin, logoutAdmin } from '../api-client';
import { authQueryKeys } from '../queries/auth.queries';

export function useLoginAdminMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: AdminLoginInput) => loginAdmin(input),
    onSuccess: (session) => {
      queryClient.setQueryData(authQueryKeys.session, session);
    },
  });
}

export function useLogoutAdminMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: logoutAdmin,
    onSuccess: (session) => {
      queryClient.setQueryData(authQueryKeys.session, session);
      void queryClient.invalidateQueries();
    },
  });
}
