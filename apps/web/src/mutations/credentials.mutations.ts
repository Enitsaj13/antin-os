import { useMutation, useQueryClient } from '@tanstack/react-query';
import type {
  CreateCertificationInput,
  CreateEducationInput,
  ReorderCredentialsInput,
  UpdateCertificationInput,
  UpdateEducationInput,
  UpdatePortfolioSettingsInput,
} from '@antin-os/shared';
import {
  createCertification,
  createEducation,
  deleteCertification,
  deleteEducation,
  reorderCertifications,
  reorderEducations,
  updateCertification,
  updateEducation,
  updatePortfolioSettings,
} from '../api-client';
import { credentialsQueryKeys } from '../queries/credentials.queries';

function useInvalidateCredentialsQueries() {
  const queryClient = useQueryClient();

  return () => {
    void queryClient.invalidateQueries({ queryKey: credentialsQueryKeys.all });
  };
}

export function useUpdatePortfolioSettingsMutation() {
  const invalidateCredentialsQueries = useInvalidateCredentialsQueries();

  return useMutation({
    mutationFn: (input: UpdatePortfolioSettingsInput) =>
      updatePortfolioSettings(input),
    onSuccess: invalidateCredentialsQueries,
  });
}

export function useCreateEducationMutation() {
  const invalidateCredentialsQueries = useInvalidateCredentialsQueries();

  return useMutation({
    mutationFn: (input: CreateEducationInput) => createEducation(input),
    onSuccess: invalidateCredentialsQueries,
  });
}

export function useUpdateEducationMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateEducationInput }) =>
      updateEducation(id, input),
    onSuccess: (_education, variables) => {
      void queryClient.invalidateQueries({
        queryKey: credentialsQueryKeys.all,
      });
      void queryClient.invalidateQueries({
        queryKey: credentialsQueryKeys.educationManagedDetail(variables.id),
      });
    },
  });
}

export function useDeleteEducationMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteEducation(id),
    onSuccess: (_education, id) => {
      void queryClient.invalidateQueries({
        queryKey: credentialsQueryKeys.all,
      });
      void queryClient.invalidateQueries({
        queryKey: credentialsQueryKeys.educationManagedDetail(id),
      });
    },
  });
}

export function useReorderEducationsMutation() {
  const invalidateCredentialsQueries = useInvalidateCredentialsQueries();

  return useMutation({
    mutationFn: (input: ReorderCredentialsInput) => reorderEducations(input),
    onSuccess: invalidateCredentialsQueries,
  });
}

export function useCreateCertificationMutation() {
  const invalidateCredentialsQueries = useInvalidateCredentialsQueries();

  return useMutation({
    mutationFn: (input: CreateCertificationInput) => createCertification(input),
    onSuccess: invalidateCredentialsQueries,
  });
}

export function useUpdateCertificationMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      input,
    }: {
      id: string;
      input: UpdateCertificationInput;
    }) => updateCertification(id, input),
    onSuccess: (_certification, variables) => {
      void queryClient.invalidateQueries({
        queryKey: credentialsQueryKeys.all,
      });
      void queryClient.invalidateQueries({
        queryKey: credentialsQueryKeys.certificationManagedDetail(variables.id),
      });
    },
  });
}

export function useDeleteCertificationMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteCertification(id),
    onSuccess: (_certification, id) => {
      void queryClient.invalidateQueries({
        queryKey: credentialsQueryKeys.all,
      });
      void queryClient.invalidateQueries({
        queryKey: credentialsQueryKeys.certificationManagedDetail(id),
      });
    },
  });
}

export function useReorderCertificationsMutation() {
  const invalidateCredentialsQueries = useInvalidateCredentialsQueries();

  return useMutation({
    mutationFn: (input: ReorderCredentialsInput) =>
      reorderCertifications(input),
    onSuccess: invalidateCredentialsQueries,
  });
}
