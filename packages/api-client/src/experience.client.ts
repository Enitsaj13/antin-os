import type {
  CreateExperienceInput,
  Experience,
  ReorderExperienceInput,
  UpdateExperienceInput,
} from '@antin-os/shared';
import { requestJson } from './http-client';

export function createExperience(
  input: CreateExperienceInput,
): Promise<Experience> {
  return requestJson<Experience>('/experience', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
}

export function getExperiences(): Promise<Experience[]> {
  return requestJson<Experience[]>('/experience');
}

export function getExperience(id: string): Promise<Experience> {
  return requestJson<Experience>(`/experience/${encodeURIComponent(id)}`);
}

export function updateExperience(
  id: string,
  input: UpdateExperienceInput,
): Promise<Experience> {
  return requestJson<Experience>(`/experience/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
}

export function deleteExperience(id: string): Promise<Experience> {
  return requestJson<Experience>(`/experience/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });
}

export function reorderExperiences(
  input: ReorderExperienceInput,
): Promise<Experience[]> {
  return requestJson<Experience[]>('/experience/reorder', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
}

export function getPublicExperiences(): Promise<Experience[]> {
  return requestJson<Experience[]>('/public/experience');
}
