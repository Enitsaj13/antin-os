import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { CreateProjectInput, UpdateProjectInput } from '@antin-os/shared';
import {
  createProject,
  deleteProject,
  updateProject,
  uploadProjectImage,
} from '../api-client';
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
    onSuccess: (_project, variables) => {
      void queryClient.invalidateQueries({ queryKey: projectQueryKeys.all });
      void queryClient.invalidateQueries({
        queryKey: projectQueryKeys.managedDetail(variables.id),
      });
    },
  });
}

export function useDeleteProjectMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteProject(id),
    onSuccess: (_project, id) => {
      void queryClient.invalidateQueries({ queryKey: projectQueryKeys.all });
      void queryClient.invalidateQueries({
        queryKey: projectQueryKeys.managedDetail(id),
      });
    },
  });
}

export function useUploadProjectImageMutation() {
  return useMutation({
    mutationFn: uploadProjectImage,
  });
}
