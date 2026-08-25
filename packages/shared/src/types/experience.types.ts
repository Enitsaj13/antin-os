export interface Experience {
  id: string;
  company: string;
  role: string;
  location: string;
  employmentType: string;
  startDate: string;
  endDate: string | null;
  isCurrent: boolean;
  summary: string;
  achievements: string[];
  technologies: string[];
  displayOrder: number;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateExperienceInput {
  company: string;
  role: string;
  location: string;
  employmentType: string;
  startDate: string;
  endDate?: string | null;
  isCurrent?: boolean;
  summary: string;
  achievements?: string[];
  technologies?: string[];
  displayOrder: number;
  isPublic?: boolean;
}

export type UpdateExperienceInput = Partial<CreateExperienceInput>;

export interface ReorderExperienceItem {
  id: string;
  displayOrder: number;
}

export interface ReorderExperienceInput {
  items: ReorderExperienceItem[];
}
