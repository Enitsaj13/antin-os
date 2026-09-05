import type { JobApplicationEvidenceReference } from '@antin-os/shared';
import type {
  JobAssistantGeneratedResult,
  JobAssistantGenerationRequest,
} from './job-application-assistant.types';

function firstEvidence(
  request: JobAssistantGenerationRequest,
): JobApplicationEvidenceReference | undefined {
  const evidence = request.evidence[0];
  return evidence ? { ...evidence } : undefined;
}

function confirmationForMissingEvidence(
  evidence: JobApplicationEvidenceReference | undefined,
): string[] {
  return evidence
    ? []
    : ['Confirm relevant experience before using generated claims.'];
}

export function createMockJobApplicationAssistantResult(
  request: JobAssistantGenerationRequest,
): JobAssistantGeneratedResult {
  const { jobApplication } = request.source;
  const evidence = firstEvidence(request);
  const needsConfirmation = confirmationForMissingEvidence(evidence);

  if (request.operation === 'analyze') {
    return {
      operation: 'analyze',
      suggestedCompany: jobApplication.company,
      suggestedPosition: jobApplication.position,
      responsibilities: [
        `Review the saved responsibilities for ${jobApplication.position}.`,
      ],
      requiredSkills: ['Confirm the required skills in the job description.'],
      preferredSkills: ['Confirm the preferred skills in the job description.'],
      keywords: [jobApplication.position, jobApplication.company],
      matchingQualifications: evidence
        ? [
            {
              requirement: `Relevant evidence for ${jobApplication.position}`,
              qualification: `${evidence.label} contains owner-managed professional evidence.`,
              evidence: [evidence],
            },
          ]
        : [],
      gaps: [
        {
          requirement: 'Any requirement without cited portfolio evidence',
          reason:
            'No supported qualification should be inferred automatically.',
        },
      ],
      unknowns: ['Confirm nuanced requirements against the original listing.'],
      needsConfirmation,
    };
  }

  if (request.operation === 'interviewQuestions') {
    return {
      operation: 'interviewQuestions',
      questions: [
        {
          question: `How does your experience prepare you for the ${jobApplication.position} role?`,
          suggestedAnswer: evidence
            ? `I would use the owner-managed ${evidence.label} evidence as the basis for a truthful answer, then tailor the wording to this role.`
            : 'I need to confirm a relevant example before answering this question.',
          evidence: evidence ? [evidence] : [],
          needsConfirmation: !evidence,
        },
      ],
      needsConfirmation,
    };
  }

  if (request.operation === 'selfIntroduction') {
    return {
      operation: 'selfIntroduction',
      content: `I am preparing for the ${jobApplication.position} opportunity at ${jobApplication.company}. I will tailor this introduction using only my confirmed professional experience.`,
      needsConfirmation,
    };
  }

  if (request.operation === 'coverLetter') {
    return {
      operation: 'coverLetter',
      content: `Dear ${jobApplication.company} hiring team,\n\nI am interested in the ${jobApplication.position} role. I will review this draft and add only qualifications supported by my confirmed experience.`,
      needsConfirmation,
    };
  }

  if (request.operation === 'followUpMessage') {
    return {
      operation: 'followUpMessage',
      content: `Hello, I am following up on my ${jobApplication.position} application with ${jobApplication.company}. Please let me know if I can provide any additional information.`,
      needsConfirmation,
    };
  }

  return {
    operation: 'nextAction',
    action:
      'Review the saved job description and prepare one supported example.',
    rationale: `This keeps preparation for ${jobApplication.position} grounded in confirmed evidence without changing the application.`,
    suggestedDate: jobApplication.nextActionDate,
    needsConfirmation,
  };
}
