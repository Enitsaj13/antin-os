import { useQuery } from '@tanstack/react-query';
import {
  getExperience,
  getExperiences,
  getPublicExperiences,
} from '../api-client';

export const experienceQueryKeys = {
  all: ['experience'] as const,
  managedList: () => [...experienceQueryKeys.all, 'managed'] as const,
  managedDetail: (id: string) =>
    [...experienceQueryKeys.managedList(), id] as const,
  publicList: () => [...experienceQueryKeys.all, 'public'] as const,
};

export function useExperiences() {
  return useQuery({
    queryKey: experienceQueryKeys.managedList(),
    queryFn: getExperiences,
  });
}

export function useExperience(id: string) {
  return useQuery({
    queryKey: experienceQueryKeys.managedDetail(id),
    queryFn: () => getExperience(id),
    enabled: id.length > 0,
  });
}

export function usePublicExperiences() {
  return useQuery({
    queryKey: experienceQueryKeys.publicList(),
    queryFn: getPublicExperiences,
  });
}
