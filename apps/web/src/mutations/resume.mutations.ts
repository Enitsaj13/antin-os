import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { UpdateResumePublicationInput } from '@antin-os/shared';
import {
  deleteResume,
  updateResumePublication,
  uploadResume,
} from '../api-client';
import { resumeQueryKeys } from '../queries/resume.queries';

function useInvalidateResumeQueries() {
  const queryClient = useQueryClient();

  return () => {
    void queryClient.invalidateQueries({ queryKey: resumeQueryKeys.all });
  };
}

export function useUploadResumeMutation() {
  const invalidateResumeQueries = useInvalidateResumeQueries();

  return useMutation({
    mutationFn: (input: {
      file: File | Blob;
      fileName: string;
      onProgress: (progress: number) => void;
    }) => uploadResume(input),
    onSuccess: invalidateResumeQueries,
  });
}

export function useUpdateResumePublicationMutation() {
  const invalidateResumeQueries = useInvalidateResumeQueries();

  return useMutation({
    mutationFn: (input: UpdateResumePublicationInput) =>
      updateResumePublication(input),
    onSuccess: invalidateResumeQueries,
  });
}

export function useDeleteResumeMutation() {
  const invalidateResumeQueries = useInvalidateResumeQueries();

  return useMutation({
    mutationFn: deleteResume,
    onSuccess: invalidateResumeQueries,
  });
}
