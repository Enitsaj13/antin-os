import type { JobApplicationAssistantOperation } from '@antin-os/shared';

const stringArray = (maxItems = 20) => ({
  type: 'array',
  maxItems,
  items: { type: 'string', maxLength: 2_000 },
});

const evidenceReferenceSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['sourceType', 'sourceId', 'label', 'field'],
  properties: {
    sourceType: {
      type: 'string',
      enum: ['profile', 'experience', 'project'],
    },
    sourceId: { type: 'string', maxLength: 200 },
    label: { type: 'string', maxLength: 300 },
    field: { type: 'string', maxLength: 100 },
  },
} as const;

const needsConfirmationProperty = stringArray(20);

const analysisSchema = {
  type: 'object',
  additionalProperties: false,
  required: [
    'suggestedCompany',
    'suggestedPosition',
    'responsibilities',
    'requiredSkills',
    'preferredSkills',
    'keywords',
    'matchingQualifications',
    'gaps',
    'unknowns',
    'needsConfirmation',
  ],
  properties: {
    suggestedCompany: { type: ['string', 'null'], maxLength: 200 },
    suggestedPosition: { type: ['string', 'null'], maxLength: 200 },
    responsibilities: stringArray(),
    requiredSkills: stringArray(),
    preferredSkills: stringArray(),
    keywords: stringArray(30),
    matchingQualifications: {
      type: 'array',
      maxItems: 30,
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['requirement', 'qualification', 'evidence'],
        properties: {
          requirement: { type: 'string', maxLength: 2_000 },
          qualification: { type: 'string', maxLength: 2_000 },
          evidence: {
            type: 'array',
            minItems: 1,
            maxItems: 10,
            items: evidenceReferenceSchema,
          },
        },
      },
    },
    gaps: {
      type: 'array',
      maxItems: 30,
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['requirement', 'reason'],
        properties: {
          requirement: { type: 'string', maxLength: 2_000 },
          reason: { type: 'string', maxLength: 2_000 },
        },
      },
    },
    unknowns: stringArray(30),
    needsConfirmation: needsConfirmationProperty,
  },
} as const;

const interviewQuestionsSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['questions', 'needsConfirmation'],
  properties: {
    questions: {
      type: 'array',
      maxItems: 15,
      items: {
        type: 'object',
        additionalProperties: false,
        required: [
          'question',
          'suggestedAnswer',
          'evidence',
          'needsConfirmation',
        ],
        properties: {
          question: { type: 'string', maxLength: 2_000 },
          suggestedAnswer: { type: 'string', maxLength: 5_000 },
          evidence: {
            type: 'array',
            maxItems: 10,
            items: evidenceReferenceSchema,
          },
          needsConfirmation: { type: 'boolean' },
        },
      },
    },
    needsConfirmation: needsConfirmationProperty,
  },
} as const;

const textDraftSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['content', 'needsConfirmation'],
  properties: {
    content: { type: 'string', maxLength: 10_000 },
    needsConfirmation: needsConfirmationProperty,
  },
} as const;

const nextActionSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['action', 'rationale', 'suggestedDate', 'needsConfirmation'],
  properties: {
    action: { type: 'string', maxLength: 2_000 },
    rationale: { type: 'string', maxLength: 3_000 },
    suggestedDate: { type: ['string', 'null'], maxLength: 10 },
    needsConfirmation: needsConfirmationProperty,
  },
} as const;

export function jobApplicationAssistantSchema(
  operation: JobApplicationAssistantOperation,
): Record<string, unknown> {
  if (operation === 'analyze') {
    return analysisSchema;
  }

  if (operation === 'interviewQuestions') {
    return interviewQuestionsSchema;
  }

  if (operation === 'nextAction') {
    return nextActionSchema;
  }

  return textDraftSchema;
}
