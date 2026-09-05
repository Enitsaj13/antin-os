import type { CaseStudyDraft } from '@antin-os/shared';
import { AiDraftingError } from '@src/ai-drafting/ai-drafting.error';

export const CASE_STUDY_DRAFT_PROVIDER = Symbol('CASE_STUDY_DRAFT_PROVIDER');

export type CaseStudyDraftProjectSource = {
  id: string;
  title: string;
  slug: string;
  summary: string;
  description: string | null;
  techStack: string[];
  repoUrl: string | null;
  liveUrl: string | null;
  isPublic: boolean;
};

export type CaseStudyDraftProviderInput = {
  project: CaseStudyDraftProjectSource;
  notes?: string;
  maxOutputTokens: number;
  signal?: AbortSignal;
};

export type CaseStudyDraftErrorCode =
  'configuration' | 'malformed' | 'provider' | 'timeout';

export class CaseStudyDraftProviderError extends AiDraftingError {
  declare readonly code: CaseStudyDraftErrorCode;
}

export interface CaseStudyDraftProvider {
  generate(input: CaseStudyDraftProviderInput): Promise<CaseStudyDraft>;
}

export const CASE_STUDY_DRAFT_INSTRUCTIONS = [
  'Generate a recruiter-readable project case-study draft.',
  'Use only the provided project fields and optional owner notes.',
  'Do not invent metrics, responsibilities, technologies, business outcomes, dates, clients, employers, or credentials.',
  'Keep role as a short title only, such as "Full-stack Developer" or "Software Engineer - Mobile & Web"; do not include responsibilities, portals, technologies, or explanatory sentences in role.',
  'Put responsibility details in responsibilities, context, or approach instead of role.',
  'Always provide lessonsLearned as a recruiter-readable reflective paragraph of 2 to 4 sentences.',
  'Base lessonsLearned on confirmed project role, stack, workflow, architecture, collaboration, QA, delivery, or engineering practices.',
  'Prefer specific engineering takeaways over generic statements when supported by the provided data.',
  'If a lesson is inferred rather than directly stated, keep it conservative and add a needsConfirmation item.',
  'Never return null or an empty string for lessonsLearned.',
  'If information is missing or uncertain, omit it or add a concise needsConfirmation item.',
  'Return only strict JSON that matches the provided schema.',
].join(' ');

export const caseStudyDraftJsonSchema = {
  type: 'object',
  additionalProperties: false,
  required: [
    'context',
    'problem',
    'role',
    'approach',
    'responsibilities',
    'technicalChallenges',
    'outcomes',
    'lessonsLearned',
    'needsConfirmation',
  ],
  properties: {
    context: { type: 'string' },
    problem: { type: 'string' },
    role: { type: 'string' },
    approach: { type: 'string' },
    responsibilities: {
      type: 'array',
      items: { type: 'string' },
    },
    technicalChallenges: {
      type: 'array',
      items: { type: 'string' },
    },
    outcomes: {
      type: 'array',
      items: { type: 'string' },
    },
    lessonsLearned: { type: 'string' },
    needsConfirmation: {
      type: 'array',
      items: { type: 'string' },
    },
  },
} as const;

function isStringArray(value: unknown): value is string[] {
  return (
    Array.isArray(value) && value.every((item) => typeof item === 'string')
  );
}

function normalizeText(value: string): string {
  return value.trim();
}

function normalizeTextArray(value: string[]): string[] {
  return value.map(normalizeText).filter(Boolean);
}

export function normalizeCaseStudyDraft(value: unknown): CaseStudyDraft {
  if (!value || typeof value !== 'object') {
    throw new CaseStudyDraftProviderError(
      'malformed',
      'AI provider returned malformed draft content.',
    );
  }

  const record = value as Record<string, unknown>;

  for (const key of [
    'context',
    'problem',
    'role',
    'approach',
    'lessonsLearned',
  ] as const) {
    if (typeof record[key] !== 'string' || !record[key].trim()) {
      throw new CaseStudyDraftProviderError(
        'malformed',
        'AI provider returned malformed draft content.',
      );
    }
  }

  for (const key of [
    'responsibilities',
    'technicalChallenges',
    'outcomes',
    'needsConfirmation',
  ] as const) {
    if (!isStringArray(record[key])) {
      throw new CaseStudyDraftProviderError(
        'malformed',
        'AI provider returned malformed draft content.',
      );
    }
  }

  const context = record.context as string;
  const problem = record.problem as string;
  const role = record.role as string;
  const approach = record.approach as string;
  const lessonsLearned = record.lessonsLearned as string;
  const responsibilities = record.responsibilities as string[];
  const technicalChallenges = record.technicalChallenges as string[];
  const outcomes = record.outcomes as string[];
  const needsConfirmation = record.needsConfirmation as string[];

  return {
    context: normalizeText(context),
    problem: normalizeText(problem),
    role: normalizeText(role),
    approach: normalizeText(approach),
    responsibilities: normalizeTextArray(responsibilities),
    technicalChallenges: normalizeTextArray(technicalChallenges),
    outcomes: normalizeTextArray(outcomes),
    lessonsLearned: normalizeText(lessonsLearned),
    needsConfirmation: normalizeTextArray(needsConfirmation),
  };
}
