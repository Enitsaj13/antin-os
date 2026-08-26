export interface Project {
  id: string;
  title: string;
  slug: string;
  summary: string;
  description: string | null;
  techStack: string[];
  repoUrl: string | null;
  liveUrl: string | null;
  imageUrl: string | null;
  imageKey: string | null;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
  caseStudy?: ProjectCaseStudy | null;
}

export interface ProjectCaseStudy {
  id: string;
  projectId: string;
  context: string;
  problem: string;
  role: string;
  approach: string;
  responsibilities: string[];
  technicalChallenges: string[];
  outcomes: string[];
  lessonsLearned: string | null;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
}

export type PublicProjectCaseStudy = Omit<
  ProjectCaseStudy,
  'isPublic' | 'createdAt'
> & {
  isPublic: true;
};

export interface CreateProjectCaseStudyInput {
  context: string;
  problem: string;
  role: string;
  approach: string;
  responsibilities?: string[];
  technicalChallenges?: string[];
  outcomes?: string[];
  lessonsLearned?: string | null;
  isPublic?: boolean;
}

export type UpdateProjectCaseStudyInput = Partial<CreateProjectCaseStudyInput>;

export interface UpdateProjectCaseStudyPublicationInput {
  isPublic: boolean;
}

export interface CaseStudyDraft {
  context: string;
  problem: string;
  role: string;
  approach: string;
  responsibilities: string[];
  technicalChallenges: string[];
  outcomes: string[];
  lessonsLearned: string | null;
  needsConfirmation: string[];
}

export interface CreateCaseStudyDraftInput {
  notes?: string;
}

export interface CaseStudyDraftResponse {
  draft: CaseStudyDraft;
}

export interface CreateProjectInput {
  title: string;
  slug: string;
  summary: string;
  description?: string | null;
  techStack: string[];
  repoUrl?: string | null;
  liveUrl?: string | null;
  imageUrl?: string | null;
  imageKey?: string | null;
  isPublic?: boolean;
}

export type UpdateProjectInput = Partial<CreateProjectInput>;

export interface CreateProjectImageUploadInput {
  fileName: string;
  contentType: string;
  size: number;
}

export interface ProjectImageUpload {
  key: string;
  uploadUrl: string;
  imageUrl: string;
}
