import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { CreateProjectInput, UpdateProjectInput } from '@antin-os/shared';
import { createProject, deleteProject, updateProject } from '../api-client';
import { projectQueryKeys } from '../queries/project.queries';

export function useCreateProjectMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateProjectInput) => createProject(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: projectQueryKeys.all });
    },
  });
}

export function useUpdateProjectMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateProjectInput }) =>
      updateProject(id, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: projectQueryKeys.all });
    },
  });
}

export function useDeleteProjectMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteProject(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: projectQueryKeys.all });
    },
  });
}
