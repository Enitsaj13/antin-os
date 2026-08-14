import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { UpsertProfileInput } from '@antin-os/shared';
import {
  removeProfilePicture,
  saveProfile,
  uploadProfilePicture,
} from '../api-client';
import { profileQueryKeys } from '../queries/profile.queries';

export function useSaveProfileMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpsertProfileInput) => saveProfile(input),
    onSuccess: (profile) => {
      queryClient.setQueryData(profileQueryKeys.managed(), profile);
      queryClient.setQueryData(profileQueryKeys.public(), profile);
    },
  });
}

export function useUploadProfilePictureMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      file,
      onProgress,
    }: {
      file: Blob;
      onProgress: (progress: number) => void;
    }) => uploadProfilePicture(file, onProgress),
    onSuccess: (profile) => {
      queryClient.setQueryData(profileQueryKeys.managed(), profile);
      queryClient.setQueryData(profileQueryKeys.public(), profile);
    },
  });
}

export function useRemoveProfilePictureMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: removeProfilePicture,
    onSuccess: (profile) => {
      queryClient.setQueryData(profileQueryKeys.managed(), profile);
      queryClient.setQueryData(profileQueryKeys.public(), profile);
    },
  });
}
