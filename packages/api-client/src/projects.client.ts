import type {
  CreateProjectInput,
  Project,
  UpdateProjectInput,
} from '@antin-os/shared';
import { requestJson } from './http-client';

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

export function getPublicProjects(): Promise<Project[]> {
  return requestJson<Project[]>('/public/projects');
}

export function getPublicProject(slug: string): Promise<Project> {
  return requestJson<Project>(`/public/projects/${encodeURIComponent(slug)}`);
}
