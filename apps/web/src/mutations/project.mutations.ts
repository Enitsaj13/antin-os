import { useMutation, useQueryClient } from '@tanstack/react-query';
import type {
  CreateCaseStudyDraftInput,
  CreateProjectCaseStudyInput,
  CreateProjectInput,
  ReorderProjectInput,
  UpdateProjectCaseStudyInput,
  UpdateProjectCaseStudyPublicationInput,
  UpdateProjectInput,
} from '@antin-os/shared';
import {
  createProjectCaseStudy,
  createProject,
  deleteProjectCaseStudy,
  deleteProject,
  generateProjectCaseStudyDraft,
  reorderProjects,
  updateProjectCaseStudy,
  updateProjectCaseStudyPublication,
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

export function useReorderProjectsMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: ReorderProjectInput) => reorderProjects(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: projectQueryKeys.all });
    },
  });
}

export function useUploadProjectImageMutation() {
  return useMutation({
    mutationFn: uploadProjectImage,
  });
}

export function useGenerateProjectCaseStudyDraftMutation() {
  return useMutation({
    mutationFn: ({
      projectId,
      input,
    }: {
      projectId: string;
      input: CreateCaseStudyDraftInput;
    }) => generateProjectCaseStudyDraft(projectId, input),
  });
}

function invalidateProjectCaseStudyQueries(
  queryClient: ReturnType<typeof useQueryClient>,
  projectId: string,
) {
  void queryClient.invalidateQueries({ queryKey: projectQueryKeys.all });
  void queryClient.invalidateQueries({
    queryKey: projectQueryKeys.managedDetail(projectId),
  });
  void queryClient.invalidateQueries({
    queryKey: projectQueryKeys.managedCaseStudy(projectId),
  });
}

export function useCreateProjectCaseStudyMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      projectId,
      input,
    }: {
      projectId: string;
      input: CreateProjectCaseStudyInput;
    }) => createProjectCaseStudy(projectId, input),
    onSuccess: (_caseStudy, variables) => {
      invalidateProjectCaseStudyQueries(queryClient, variables.projectId);
    },
  });
}

export function useUpdateProjectCaseStudyMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      projectId,
      input,
    }: {
      projectId: string;
      input: UpdateProjectCaseStudyInput;
    }) => updateProjectCaseStudy(projectId, input),
    onSuccess: (_caseStudy, variables) => {
      invalidateProjectCaseStudyQueries(queryClient, variables.projectId);
    },
  });
}

export function useUpdateProjectCaseStudyPublicationMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      projectId,
      input,
    }: {
      projectId: string;
      input: UpdateProjectCaseStudyPublicationInput;
    }) => updateProjectCaseStudyPublication(projectId, input),
    onSuccess: (_caseStudy, variables) => {
      invalidateProjectCaseStudyQueries(queryClient, variables.projectId);
    },
  });
}

export function useDeleteProjectCaseStudyMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (projectId: string) => deleteProjectCaseStudy(projectId),
    onSuccess: (_caseStudy, projectId) => {
      invalidateProjectCaseStudyQueries(queryClient, projectId);
    },
  });
}
