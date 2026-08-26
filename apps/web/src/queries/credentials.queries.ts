import { useQuery } from '@tanstack/react-query';
import {
  getCertification,
  getCertifications,
  getEducation,
  getEducations,
  getPortfolioSettings,
  getPublicCertifications,
  getPublicEducations,
} from '../api-client';

export const credentialsQueryKeys = {
  all: ['credentials'] as const,
  settings: () => [...credentialsQueryKeys.all, 'settings'] as const,
  education: () => [...credentialsQueryKeys.all, 'education'] as const,
  educationManagedList: () =>
    [...credentialsQueryKeys.education(), 'managed'] as const,
  educationManagedDetail: (id: string) =>
    [...credentialsQueryKeys.educationManagedList(), id] as const,
  educationPublicList: () =>
    [...credentialsQueryKeys.education(), 'public'] as const,
  certifications: () =>
    [...credentialsQueryKeys.all, 'certifications'] as const,
  certificationManagedList: () =>
    [...credentialsQueryKeys.certifications(), 'managed'] as const,
  certificationManagedDetail: (id: string) =>
    [...credentialsQueryKeys.certificationManagedList(), id] as const,
  certificationPublicList: () =>
    [...credentialsQueryKeys.certifications(), 'public'] as const,
};

export function usePortfolioSettings() {
  return useQuery({
    queryKey: credentialsQueryKeys.settings(),
    queryFn: getPortfolioSettings,
  });
}

export function useEducations() {
  return useQuery({
    queryKey: credentialsQueryKeys.educationManagedList(),
    queryFn: getEducations,
  });
}

export function useEducation(id: string) {
  return useQuery({
    queryKey: credentialsQueryKeys.educationManagedDetail(id),
    queryFn: () => getEducation(id),
    enabled: id.length > 0,
  });
}

export function usePublicEducations() {
  return useQuery({
    queryKey: credentialsQueryKeys.educationPublicList(),
    queryFn: getPublicEducations,
  });
}

export function useCertifications() {
  return useQuery({
    queryKey: credentialsQueryKeys.certificationManagedList(),
    queryFn: getCertifications,
  });
}

export function useCertification(id: string) {
  return useQuery({
    queryKey: credentialsQueryKeys.certificationManagedDetail(id),
    queryFn: () => getCertification(id),
    enabled: id.length > 0,
  });
}

export function usePublicCertifications() {
  return useQuery({
    queryKey: credentialsQueryKeys.certificationPublicList(),
    queryFn: getPublicCertifications,
  });
}
