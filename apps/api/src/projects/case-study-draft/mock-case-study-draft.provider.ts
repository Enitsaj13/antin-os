import { Injectable } from '@nestjs/common';
import type { CaseStudyDraft } from '@antin-os/shared';
import type {
  CaseStudyDraftProvider,
  CaseStudyDraftProviderInput,
} from './case-study-draft.provider';

@Injectable()
export class MockCaseStudyDraftProvider implements CaseStudyDraftProvider {
  generate(input: CaseStudyDraftProviderInput): Promise<CaseStudyDraft> {
    return Promise.resolve(createMockCaseStudyDraft(input));
  }
}

export function createMockCaseStudyDraft(
  input: CaseStudyDraftProviderInput,
): CaseStudyDraft {
  const { project, notes } = input;
  const noteText = notes ? ` Owner notes: ${notes}` : '';

  return {
    context: `${project.title} is a portfolio project about ${project.summary}.${noteText}`,
    problem:
      project.description ??
      `The project needed a clear explanation of the problem it solves.`,
    role: 'Owner and Developer',
    approach: `Used ${project.techStack.join(', ')} to build and explain the project in a structured way.`,
    responsibilities: [
      `Built and maintained ${project.title}.`,
      'Prepared the project for recruiter review.',
    ],
    technicalChallenges: [
      'Confirm the most important technical challenge before publishing.',
    ],
    outcomes: ['Confirm measurable outcomes before publishing.'],
    lessonsLearned:
      'This project reinforced the value of keeping implementation details tied to clear product workflows and shared technical contracts. Before publishing, confirm the specific architecture, validation, delivery, and collaboration lessons that best represent the work.',
    needsConfirmation: [
      'Confirm the exact role, responsibilities, technical challenges, and outcomes before publishing.',
    ],
  };
}
