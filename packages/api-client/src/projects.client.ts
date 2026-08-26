import type {
  CreateProjectCaseStudyInput,
  CreateProjectInput,
  ProjectImageUpload,
  Project,
  ProjectCaseStudy,
  UpdateProjectCaseStudyInput,
  UpdateProjectCaseStudyPublicationInput,
  UpdateProjectInput,
  CreateProjectImageUploadInput,
} from '@antin-os/shared';
import { requestJson, requestNullableJson, uploadBinary } from './http-client';

export function createProject(input: CreateProjectInput): Promise<Project> {
  return requestJson<Project>('/projects', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
}

export function getProjects(): Promise<Project[]> {
  return requestJson<Project[]>('/projects');
}

export function getProject(idOrSlug: string): Promise<Project> {
  return requestJson<Project>(`/projects/${encodeURIComponent(idOrSlug)}`);
}

export function getProjectCaseStudy(
  projectId: string,
): Promise<ProjectCaseStudy | null> {
  return requestNullableJson<ProjectCaseStudy>(
    `/projects/${encodeURIComponent(projectId)}/case-study`,
  );
}

export function createProjectCaseStudy(
  projectId: string,
  input: CreateProjectCaseStudyInput,
): Promise<ProjectCaseStudy> {
  return requestJson<ProjectCaseStudy>(
    `/projects/${encodeURIComponent(projectId)}/case-study`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    },
  );
}

export function updateProjectCaseStudy(
  projectId: string,
  input: UpdateProjectCaseStudyInput,
): Promise<ProjectCaseStudy> {
  return requestJson<ProjectCaseStudy>(
    `/projects/${encodeURIComponent(projectId)}/case-study`,
    {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    },
  );
}

export function updateProjectCaseStudyPublication(
  projectId: string,
  input: UpdateProjectCaseStudyPublicationInput,
): Promise<ProjectCaseStudy> {
  return requestJson<ProjectCaseStudy>(
    `/projects/${encodeURIComponent(projectId)}/case-study/publication`,
    {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    },
  );
}

export function deleteProjectCaseStudy(
  projectId: string,
): Promise<ProjectCaseStudy> {
  return requestJson<ProjectCaseStudy>(
    `/projects/${encodeURIComponent(projectId)}/case-study`,
    {
      method: 'DELETE',
    },
  );
}

export function updateProject(
  id: string,
  input: UpdateProjectInput,
): Promise<Project> {
  return requestJson<Project>(`/projects/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
}

export function deleteProject(id: string): Promise<Project> {
  return requestJson<Project>(`/projects/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });
}

export async function uploadProjectImage(input: {
  file: Blob;
  fileName: string;
  contentType: string;
  onProgress: (progress: number) => void;
}): Promise<ProjectImageUpload> {
  const upload = await requestJson<ProjectImageUpload>(
    '/projects/image-upload',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fileName: input.fileName,
        contentType: input.contentType,
        size: input.file.size,
      } satisfies CreateProjectImageUploadInput),
    },
  );

  await uploadBinary(
    upload.uploadUrl,
    input.file,
    input.contentType,
    input.onProgress,
  );

  input.onProgress(100);

  return upload;
}

export function getPublicProjects(): Promise<Project[]> {
  return requestJson<Project[]>('/public/projects');
}

export function getPublicProject(slug: string): Promise<Project> {
  return requestJson<Project>(`/public/projects/${encodeURIComponent(slug)}`);
}
