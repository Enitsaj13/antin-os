import type {
  Project as PrismaProject,
  ProjectCaseStudy as PrismaProjectCaseStudy,
} from '@prisma/client';
import type { Project, ProjectCaseStudy } from '@antin-os/shared';

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
  | 'displayOrder'
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
  displayOrder: true,
  createdAt: true,
  updatedAt: true,
} as const;

export type ProjectResponse = Project;

export type ProjectCaseStudyRecord = Pick<
  PrismaProjectCaseStudy,
  | 'id'
  | 'projectId'
  | 'context'
  | 'problem'
  | 'role'
  | 'approach'
  | 'responsibilities'
  | 'technicalChallenges'
  | 'outcomes'
  | 'lessonsLearned'
  | 'isPublic'
  | 'createdAt'
  | 'updatedAt'
>;

export const projectCaseStudySelect = {
  id: true,
  projectId: true,
  context: true,
  problem: true,
  role: true,
  approach: true,
  responsibilities: true,
  technicalChallenges: true,
  outcomes: true,
  lessonsLearned: true,
  isPublic: true,
  createdAt: true,
  updatedAt: true,
} as const;

export type ProjectWithCaseStudyRecord = ProjectRecord & {
  caseStudy?: ProjectCaseStudyRecord | null;
};

export function toProjectCaseStudyResponse(
  caseStudy: ProjectCaseStudyRecord,
): ProjectCaseStudy {
  return {
    ...caseStudy,
    createdAt: caseStudy.createdAt.toISOString(),
    updatedAt: caseStudy.updatedAt.toISOString(),
  };
}

export function toProjectResponse(
  project: ProjectRecord | ProjectWithCaseStudyRecord,
): ProjectResponse {
  const response: ProjectResponse = {
    id: project.id,
    title: project.title,
    slug: project.slug,
    summary: project.summary,
    description: project.description,
    techStack: project.techStack,
    repoUrl: project.repoUrl,
    liveUrl: project.liveUrl,
    imageUrl: project.imageUrl,
    imageKey: project.imageKey,
    isPublic: project.isPublic,
    displayOrder: project.displayOrder,
    createdAt: project.createdAt.toISOString(),
    updatedAt: project.updatedAt.toISOString(),
  };

  if ('caseStudy' in project) {
    response.caseStudy = project.caseStudy
      ? toProjectCaseStudyResponse(project.caseStudy)
      : null;
  }

  return response;
}
