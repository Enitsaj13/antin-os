import type { CaseStudyDraft } from '@antin-os/shared';

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

export class CaseStudyDraftProviderError extends Error {
  constructor(
    public readonly code: CaseStudyDraftErrorCode,
    message: string,
  ) {
    super(message);
  }
}

export interface CaseStudyDraftProvider {
  generate(input: CaseStudyDraftProviderInput): Promise<CaseStudyDraft>;
}

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
