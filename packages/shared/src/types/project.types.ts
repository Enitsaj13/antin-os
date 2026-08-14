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
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
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
  isPublic?: boolean;
}

export type UpdateProjectInput = Partial<CreateProjectInput>;
