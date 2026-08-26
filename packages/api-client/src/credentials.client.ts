import type {
  Certification,
  CreateCertificationInput,
  CreateEducationInput,
  Education,
  PortfolioSettings,
  ReorderCredentialsInput,
  UpdateCertificationInput,
  UpdateEducationInput,
  UpdatePortfolioSettingsInput,
} from '@antin-os/shared';
import { requestJson } from './http-client';

export function getPortfolioSettings(): Promise<PortfolioSettings> {
  return requestJson<PortfolioSettings>('/portfolio-settings');
}

export function updatePortfolioSettings(
  input: UpdatePortfolioSettingsInput,
): Promise<PortfolioSettings> {
  return requestJson<PortfolioSettings>('/portfolio-settings', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
}

export function createEducation(
  input: CreateEducationInput,
): Promise<Education> {
  return requestJson<Education>('/education', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
}

export function getEducations(): Promise<Education[]> {
  return requestJson<Education[]>('/education');
}

export function getEducation(id: string): Promise<Education> {
  return requestJson<Education>(`/education/${encodeURIComponent(id)}`);
}

export function updateEducation(
  id: string,
  input: UpdateEducationInput,
): Promise<Education> {
  return requestJson<Education>(`/education/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
}

export function deleteEducation(id: string): Promise<Education> {
  return requestJson<Education>(`/education/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });
}

export function reorderEducations(
  input: ReorderCredentialsInput,
): Promise<Education[]> {
  return requestJson<Education[]>('/education/reorder', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
}

export function getPublicEducations(): Promise<Education[]> {
  return requestJson<Education[]>('/public/education');
}

export function createCertification(
  input: CreateCertificationInput,
): Promise<Certification> {
  return requestJson<Certification>('/certifications', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
}

export function getCertifications(): Promise<Certification[]> {
  return requestJson<Certification[]>('/certifications');
}

export function getCertification(id: string): Promise<Certification> {
  return requestJson<Certification>(
    `/certifications/${encodeURIComponent(id)}`,
  );
}

export function updateCertification(
  id: string,
  input: UpdateCertificationInput,
): Promise<Certification> {
  return requestJson<Certification>(
    `/certifications/${encodeURIComponent(id)}`,
    {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    },
  );
}

export function deleteCertification(id: string): Promise<Certification> {
  return requestJson<Certification>(
    `/certifications/${encodeURIComponent(id)}`,
    {
      method: 'DELETE',
    },
  );
}

export function reorderCertifications(
  input: ReorderCredentialsInput,
): Promise<Certification[]> {
  return requestJson<Certification[]>('/certifications/reorder', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
}

export function getPublicCertifications(): Promise<Certification[]> {
  return requestJson<Certification[]>('/public/certifications');
}
