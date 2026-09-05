import type {
  JobApplicationAssistantOperation,
  JobApplicationEvidenceReference,
} from '@antin-os/shared';
import { AiDraftingError } from '@src/ai-drafting/ai-drafting.error';
import type {
  JobAssistantAnalysisResult,
  JobAssistantGeneratedResult,
  JobAssistantInterviewResult,
  JobAssistantNextActionResult,
  JobAssistantTextResult,
} from './job-application-assistant.types';

const MALFORMED_MESSAGE =
  'AI provider returned malformed job-assistant content.';

function malformed(): never {
  throw new AiDraftingError('malformed', MALFORMED_MESSAGE);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function requireRecord(value: unknown): Record<string, unknown> {
  if (!isRecord(value)) {
    malformed();
  }

  return value;
}

function requireText(value: unknown, allowEmpty = false): string {
  if (typeof value !== 'string') {
    malformed();
  }

  const normalized = value.trim();

  if (!allowEmpty && !normalized) {
    malformed();
  }

  return normalized;
}

function requireNullableText(value: unknown): string | null {
  if (value === null) {
    return null;
  }

  return requireText(value);
}

function requireTextArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    malformed();
  }

  return value.map((item) => requireText(item));
}

function evidenceKey(reference: JobApplicationEvidenceReference): string {
  return [
    reference.sourceType,
    reference.sourceId,
    reference.label,
    reference.field,
  ].join('\u0000');
}

function normalizeEvidence(
  value: unknown,
  allowedEvidence: ReadonlySet<string>,
): JobApplicationEvidenceReference[] {
  if (!Array.isArray(value)) {
    malformed();
  }

  return value.map((item) => {
    const record = requireRecord(item);
    const sourceType = record.sourceType;

    if (
      sourceType !== 'profile' &&
      sourceType !== 'experience' &&
      sourceType !== 'project'
    ) {
      malformed();
    }

    const reference = {
      sourceType,
      sourceId: requireText(record.sourceId),
      label: requireText(record.label),
      field: requireText(record.field),
    } satisfies JobApplicationEvidenceReference;

    if (!allowedEvidence.has(evidenceKey(reference))) {
      malformed();
    }

    return reference;
  });
}

function normalizeAnalysis(
  record: Record<string, unknown>,
  allowedEvidence: ReadonlySet<string>,
): JobAssistantAnalysisResult {
  if (!Array.isArray(record.matchingQualifications)) {
    malformed();
  }

  if (!Array.isArray(record.gaps)) {
    malformed();
  }

  const matchingQualifications = record.matchingQualifications.map((item) => {
    const match = requireRecord(item);
    const evidence = normalizeEvidence(match.evidence, allowedEvidence);

    if (evidence.length === 0) {
      malformed();
    }

    return {
      requirement: requireText(match.requirement),
      qualification: requireText(match.qualification),
      evidence,
    };
  });

  const gaps = record.gaps.map((item) => {
    const gap = requireRecord(item);
    return {
      requirement: requireText(gap.requirement),
      reason: requireText(gap.reason),
    };
  });

  return {
    operation: 'analyze',
    suggestedCompany:
      record.suggestedCompany === null
        ? null
        : requireText(record.suggestedCompany),
    suggestedPosition:
      record.suggestedPosition === null
        ? null
        : requireText(record.suggestedPosition),
    responsibilities: requireTextArray(record.responsibilities),
    requiredSkills: requireTextArray(record.requiredSkills),
    preferredSkills: requireTextArray(record.preferredSkills),
    keywords: requireTextArray(record.keywords),
    matchingQualifications,
    gaps,
    unknowns: requireTextArray(record.unknowns),
    needsConfirmation: requireTextArray(record.needsConfirmation),
  };
}

function normalizeInterview(
  record: Record<string, unknown>,
  allowedEvidence: ReadonlySet<string>,
): JobAssistantInterviewResult {
  if (!Array.isArray(record.questions)) {
    malformed();
  }

  const questions = record.questions.map((item) => {
    const question = requireRecord(item);
    const evidence = normalizeEvidence(question.evidence, allowedEvidence);

    if (typeof question.needsConfirmation !== 'boolean') {
      malformed();
    }

    if (evidence.length === 0 && !question.needsConfirmation) {
      malformed();
    }

    return {
      question: requireText(question.question),
      suggestedAnswer: requireText(question.suggestedAnswer),
      evidence,
      needsConfirmation: question.needsConfirmation,
    };
  });

  return {
    operation: 'interviewQuestions',
    questions,
    needsConfirmation: requireTextArray(record.needsConfirmation),
  };
}

function normalizeTextDraft(
  operation: JobAssistantTextResult['operation'],
  record: Record<string, unknown>,
): JobAssistantTextResult {
  return {
    operation,
    content: requireText(record.content),
    needsConfirmation: requireTextArray(record.needsConfirmation),
  };
}

function normalizeNextAction(
  record: Record<string, unknown>,
): JobAssistantNextActionResult {
  const suggestedDate = requireNullableText(record.suggestedDate);

  if (suggestedDate && !/^\d{4}-\d{2}-\d{2}$/.test(suggestedDate)) {
    malformed();
  }

  return {
    operation: 'nextAction',
    action: requireText(record.action),
    rationale: requireText(record.rationale),
    suggestedDate,
    needsConfirmation: requireTextArray(record.needsConfirmation),
  };
}

export function normalizeJobApplicationAssistantResult(
  operation: JobApplicationAssistantOperation,
  value: unknown,
  evidence: readonly JobApplicationEvidenceReference[],
): JobAssistantGeneratedResult {
  const record = requireRecord(value);
  const allowedEvidence = new Set(evidence.map(evidenceKey));

  if (operation === 'analyze') {
    return normalizeAnalysis(record, allowedEvidence);
  }

  if (operation === 'interviewQuestions') {
    return normalizeInterview(record, allowedEvidence);
  }

  if (operation === 'nextAction') {
    return normalizeNextAction(record);
  }

  return normalizeTextDraft(operation, record);
}
