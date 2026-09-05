import type {
  JobApplicationAssistantOperation,
  JobApplicationEvidenceReference,
  JobApplicationInterviewQuestion,
  JobApplicationQualificationGap,
  JobApplicationQualificationMatch,
  JobApplicationStatus,
} from '@antin-os/shared';

export type JobAssistantJobSource = {
  id: string;
  company: string;
  position: string;
  jobDescription: string;
  status: JobApplicationStatus;
  applicationDate: string | null;
  interviewDate: string | null;
  nextActionDate: string | null;
};

export type JobAssistantProfileSource = {
  id: string;
  fullName: string;
  headline: string;
  biography: string;
} | null;

export type JobAssistantProjectSource = {
  id: string;
  title: string;
  summary: string;
  description: string | null;
  techStack: string[];
  caseStudy: {
    context: string;
    problem: string;
    role: string;
    approach: string;
    responsibilities: string[];
    technicalChallenges: string[];
    outcomes: string[];
    lessonsLearned: string | null;
  } | null;
};

export type JobAssistantExperienceSource = {
  id: string;
  company: string;
  role: string;
  startDate: string;
  endDate: string | null;
  isCurrent: boolean;
  summary: string;
  achievements: string[];
  technologies: string[];
};

export type JobAssistantSource = {
  jobApplication: JobAssistantJobSource;
  profile: JobAssistantProfileSource;
  projects: JobAssistantProjectSource[];
  experience: JobAssistantExperienceSource[];
};

export type JobAssistantAnalysisResult = {
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
  needsConfirmation: string[];
};

export type JobAssistantInterviewResult = {
  operation: 'interviewQuestions';
  questions: JobApplicationInterviewQuestion[];
  needsConfirmation: string[];
};

export type JobAssistantTextResult = {
  operation: 'selfIntroduction' | 'coverLetter' | 'followUpMessage';
  content: string;
  needsConfirmation: string[];
};

export type JobAssistantNextActionResult = {
  operation: 'nextAction';
  action: string;
  rationale: string;
  suggestedDate: string | null;
  needsConfirmation: string[];
};

export type JobAssistantGeneratedResult =
  | JobAssistantAnalysisResult
  | JobAssistantInterviewResult
  | JobAssistantTextResult
  | JobAssistantNextActionResult;

export type JobAssistantGenerationRequest = {
  operation: JobApplicationAssistantOperation;
  source: JobAssistantSource;
  evidence: JobApplicationEvidenceReference[];
};
