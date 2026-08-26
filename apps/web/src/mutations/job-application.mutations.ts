import { useMutation, useQueryClient } from '@tanstack/react-query';
import type {
  CreateJobApplicationInput,
  JobApplication,
  UpdateJobApplicationInput,
} from '@antin-os/shared';
import {
  createJobApplication,
  deleteJobApplication,
  updateJobApplication,
} from '../api-client';
import { jobApplicationQueryKeys } from '../queries/job-application.queries';

function invalidateJobApplicationState(
  queryClient: ReturnType<typeof useQueryClient>,
  id?: string,
) {
  void queryClient.invalidateQueries({
    queryKey: jobApplicationQueryKeys.lists(),
  });
  void queryClient.invalidateQueries({
    queryKey: jobApplicationQueryKeys.dashboard(),
  });

  if (id) {
    void queryClient.invalidateQueries({
      queryKey: jobApplicationQueryKeys.detail(id),
    });
  }
}

export function useCreateJobApplicationMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateJobApplicationInput) =>
      createJobApplication(input),
    onSuccess: (application) => {
      invalidateJobApplicationState(queryClient, application.id);
    },
  });
}

type UpdateVariables = {
  id: string;
  input: UpdateJobApplicationInput;
};

type UpdateContext = {
  listSnapshots: Array<
    readonly [readonly unknown[], JobApplication[] | undefined]
  >;
  detailSnapshot: JobApplication | undefined;
};

export function useUpdateJobApplicationMutation() {
  const queryClient = useQueryClient();

  return useMutation<JobApplication, Error, UpdateVariables, UpdateContext>({
    mutationFn: ({ id, input }) => updateJobApplication(id, input),
    onMutate: async ({ id, input }) => {
      await queryClient.cancelQueries({
        queryKey: jobApplicationQueryKeys.lists(),
      });
      await queryClient.cancelQueries({
        queryKey: jobApplicationQueryKeys.detail(id),
      });

      const listSnapshots = queryClient.getQueriesData<JobApplication[]>({
        queryKey: jobApplicationQueryKeys.lists(),
      });
      const detailSnapshot = queryClient.getQueryData<JobApplication>(
        jobApplicationQueryKeys.detail(id),
      );

      for (const [queryKey, applications] of listSnapshots) {
        if (!applications) {
          continue;
        }

        queryClient.setQueryData<JobApplication[]>(
          queryKey,
          applications.map((application) =>
            application.id === id ? { ...application, ...input } : application,
          ),
        );
      }

      if (detailSnapshot) {
        queryClient.setQueryData<JobApplication>(
          jobApplicationQueryKeys.detail(id),
          { ...detailSnapshot, ...input },
        );
      }

      return { listSnapshots, detailSnapshot };
    },
    onError: (_error, variables, context) => {
      for (const [queryKey, applications] of context?.listSnapshots ?? []) {
        queryClient.setQueryData(queryKey, applications);
      }

      if (context?.detailSnapshot) {
        queryClient.setQueryData(
          jobApplicationQueryKeys.detail(variables.id),
          context.detailSnapshot,
        );
      }
    },
    onSuccess: (application) => {
      invalidateJobApplicationState(queryClient, application.id);
    },
  });
}

export function useDeleteJobApplicationMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteJobApplication(id),
    onSuccess: (application) => {
      invalidateJobApplicationState(queryClient, application.id);
    },
  });
}
