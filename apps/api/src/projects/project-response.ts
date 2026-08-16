import type { Project as PrismaProject } from '@prisma/client';
import type { Project } from '@antin-os/shared';

export type ProjectRecord = Pick<
  PrismaProject,
  | 'id'
  | 'title'
  | 'slug'
  | 'summary'
  | 'description'
  | 'techStack'
  | 'repoUrl'
  | 'liveUrl'
  | 'imageUrl'
  | 'imageKey'
  | 'isPublic'
  | 'createdAt'
  | 'updatedAt'
>;

export const projectSelect = {
  id: true,
  title: true,
  slug: true,
  summary: true,
  description: true,
  techStack: true,
  repoUrl: true,
  liveUrl: true,
  imageUrl: true,
  imageKey: true,
  isPublic: true,
  createdAt: true,
  updatedAt: true,
} as const;

export type ProjectResponse = Project;

export function toProjectResponse(project: ProjectRecord): ProjectResponse {
  return {
    ...project,
    createdAt: project.createdAt.toISOString(),
    updatedAt: project.updatedAt.toISOString(),
  };
}
