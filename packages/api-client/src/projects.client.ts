import type {
  CreateProjectInput,
  ProjectImageUpload,
  Project,
  UpdateProjectInput,
  CreateProjectImageUploadInput,
} from '@antin-os/shared';
import { requestJson, uploadBinary } from './http-client';

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
