import { useMutation, useQueryClient } from '@tanstack/react-query';
import type {
  CreateExperienceInput,
  ReorderExperienceInput,
  UpdateExperienceInput,
} from '@antin-os/shared';
import {
  createExperience,
  deleteExperience,
  reorderExperiences,
  updateExperience,
} from '../api-client';
import { experienceQueryKeys } from '../queries/experience.queries';

export function useCreateExperienceMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateExperienceInput) => createExperience(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: experienceQueryKeys.all,
      });
    },
  });
}

export function useUpdateExperienceMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateExperienceInput }) =>
      updateExperience(id, input),
    onSuccess: (_experience, variables) => {
      void queryClient.invalidateQueries({
        queryKey: experienceQueryKeys.all,
      });
      void queryClient.invalidateQueries({
        queryKey: experienceQueryKeys.managedDetail(variables.id),
      });
    },
  });
}

export function useDeleteExperienceMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteExperience(id),
    onSuccess: (_experience, id) => {
      void queryClient.invalidateQueries({
        queryKey: experienceQueryKeys.all,
      });
      void queryClient.invalidateQueries({
        queryKey: experienceQueryKeys.managedDetail(id),
      });
    },
  });
}

export function useReorderExperiencesMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: ReorderExperienceInput) => reorderExperiences(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: experienceQueryKeys.all,
      });
    },
  });
}
