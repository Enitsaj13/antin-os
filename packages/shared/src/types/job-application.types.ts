import type {
  JobApplicationAssistantOperation,
  JobApplicationStatus,
} from '../constants/job-application.constants';

export interface JobApplication {
  id: string;
  company: string;
  position: string;
  jobUrl: string | null;
  source: string | null;
  salaryRange: string | null;
  jobDescription: string | null;
  notes: string | null;
  status: JobApplicationStatus;
  applicationDate: string | null;
  interviewDate: string | null;
  nextActionDate: string | null;
  followUpNotes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateJobApplicationInput {
  company: string;
  position: string;
  jobUrl?: string | null;
  source?: string | null;
  salaryRange?: string | null;
  jobDescription?: string | null;
  notes?: string | null;
  status?: JobApplicationStatus;
  applicationDate?: string | null;
  interviewDate?: string | null;
  nextActionDate?: string | null;
  followUpNotes?: string | null;
}

export type UpdateJobApplicationInput = Partial<CreateJobApplicationInput>;

export interface JobApplicationListFilter {
  status?: JobApplicationStatus;
  search?: string;
}

export interface JobApplicationDashboardSummary {
  total: number;
  counts: Record<JobApplicationStatus, number>;
}

export interface JobApplicationAssistantInput {
  operation: JobApplicationAssistantOperation;
}

export type JobApplicationEvidenceSourceType =
  'profile' | 'experience' | 'project';

export interface JobApplicationEvidenceReference {
  sourceType: JobApplicationEvidenceSourceType;
  sourceId: string;
  label: string;
  field: string;
}

export interface JobApplicationQualificationMatch {
  requirement: string;
  qualification: string;
  evidence: JobApplicationEvidenceReference[];
}

export interface JobApplicationQualificationGap {
  requirement: string;
  reason: string;
}

interface JobApplicationAssistantResponseBase {
  operation: JobApplicationAssistantOperation;
  sourceUpdatedAt: string;
  needsConfirmation: string[];
}

export interface JobApplicationAnalysisResponse extends JobApplicationAssistantResponseBase {
  operation: 'analyze';
  suggestedCompany: string | null;
  suggestedPosition: string | null;
  responsibilities: string[];
  requiredSkills: string[];
  preferredSkills: string[];
  keywords: string[];
  matchingQualifications: JobApplicationQualificationMatch[];
  gaps: JobApplicationQualificationGap[];
  unknowns: string[];
}

export interface JobApplicationInterviewQuestion {
  question: string;
  suggestedAnswer: string;
  evidence: JobApplicationEvidenceReference[];
  needsConfirmation: boolean;
}

export interface JobApplicationInterviewQuestionsResponse extends JobApplicationAssistantResponseBase {
  operation: 'interviewQuestions';
  questions: JobApplicationInterviewQuestion[];
}

export type JobApplicationTextDraftOperation =
  'selfIntroduction' | 'coverLetter' | 'followUpMessage';

export interface JobApplicationTextDraftResponse extends JobApplicationAssistantResponseBase {
  operation: JobApplicationTextDraftOperation;
  content: string;
}

export interface JobApplicationNextActionResponse extends JobApplicationAssistantResponseBase {
  operation: 'nextAction';
  action: string;
  rationale: string;
  suggestedDate: string | null;
}

export type JobApplicationAssistantResponse =
  | JobApplicationAnalysisResponse
  | JobApplicationInterviewQuestionsResponse
  | JobApplicationTextDraftResponse
  | JobApplicationNextActionResponse;
