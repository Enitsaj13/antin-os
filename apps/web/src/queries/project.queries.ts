import { useQuery } from '@tanstack/react-query';
import {
  getProject,
  getProjects,
  getPublicProject,
  getPublicProjects,
} from '../api-client';

export const projectQueryKeys = {
  all: ['projects'] as const,
  managedList: () => [...projectQueryKeys.all, 'managed'] as const,
  managedDetail: (idOrSlug: string) =>
    [...projectQueryKeys.managedList(), idOrSlug] as const,
  publicList: () => [...projectQueryKeys.all, 'public'] as const,
  publicDetail: (slug: string) =>
    [...projectQueryKeys.publicList(), slug] as const,
};

export function useProjects() {
  return useQuery({
    queryKey: projectQueryKeys.managedList(),
    queryFn: getProjects,
  });
}

export function useProject(idOrSlug: string) {
  return useQuery({
    queryKey: projectQueryKeys.managedDetail(idOrSlug),
    queryFn: () => getProject(idOrSlug),
    enabled: idOrSlug.length > 0,
  });
}

export function usePublicProjects() {
  return useQuery({
    queryKey: projectQueryKeys.publicList(),
    queryFn: getPublicProjects,
  });
}

export function usePublicProject(slug: string) {
  return useQuery({
    queryKey: projectQueryKeys.publicDetail(slug),
    queryFn: () => getPublicProject(slug),
    enabled: slug.length > 0,
  });
}
