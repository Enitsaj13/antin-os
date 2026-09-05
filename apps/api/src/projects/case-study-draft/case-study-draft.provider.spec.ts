import { CaseStudyDraftLimiter } from './case-study-draft.limiter';
import {
  CaseStudyDraftProviderError,
  normalizeCaseStudyDraft,
} from './case-study-draft.provider';
import { MockCaseStudyDraftProvider } from './mock-case-study-draft.provider';

const project = {
  id: 'project-1',
  title: 'Antin OS',
  slug: 'antin-os',
  summary: 'Career operating system',
  description: 'A private portfolio management project',
  techStack: ['NestJS', 'React'],
  repoUrl: null,
  liveUrl: null,
  isPublic: false,
};

describe('case-study draft domain behavior', () => {
  it('normalizes structured provider output', () => {
    expect(
      normalizeCaseStudyDraft({
        context: ' Context ',
        problem: ' Problem ',
        role: ' Developer ',
        approach: ' Approach ',
        responsibilities: [' Build ', ''],
        technicalChallenges: [' Privacy '],
        outcomes: [' Result '],
        lessonsLearned: ' Lesson ',
        needsConfirmation: [' Confirm metric ', '  '],
      }),
    ).toEqual({
      context: 'Context',
      problem: 'Problem',
      role: 'Developer',
      approach: 'Approach',
      responsibilities: ['Build'],
      technicalChallenges: ['Privacy'],
      outcomes: ['Result'],
      lessonsLearned: 'Lesson',
      needsConfirmation: ['Confirm metric'],
    });
  });

  it('rejects malformed structured output', () => {
    expect(() =>
      normalizeCaseStudyDraft({
        context: '',
        responsibilities: 'not-an-array',
      }),
    ).toThrow(CaseStudyDraftProviderError);
  });

  it('returns deterministic mock content without network use', async () => {
    const provider = new MockCaseStudyDraftProvider();
    const input = {
      project,
      notes: 'Keep the privacy boundary explicit.',
      maxOutputTokens: 1_200,
    };

    await expect(provider.generate(input)).resolves.toEqual(
      await provider.generate(input),
    );
    const result = await provider.generate(input);
    expect(result.role).toBe('Owner and Developer');
    expect(result.needsConfirmation.length).toBeGreaterThan(0);
    expect(
      result.needsConfirmation.every((item) => typeof item === 'string'),
    ).toBe(true);
  });

  it('enforces rate and usage windows in memory', () => {
    const limiter = new CaseStudyDraftLimiter();

    expect(
      limiter.consume(
        { max: 1, windowSeconds: 60 },
        { max: 2, windowSeconds: 60 },
      ),
    ).toBe('allowed');
    expect(
      limiter.consume(
        { max: 1, windowSeconds: 60 },
        { max: 2, windowSeconds: 60 },
      ),
    ).toBe('rate-limit');

    const usageLimiter = new CaseStudyDraftLimiter();
    expect(
      usageLimiter.consume(
        { max: 10, windowSeconds: 60 },
        { max: 1, windowSeconds: 60 },
      ),
    ).toBe('allowed');
    expect(
      usageLimiter.consume(
        { max: 10, windowSeconds: 60 },
        { max: 1, windowSeconds: 60 },
      ),
    ).toBe('usage-limit');
  });
});
