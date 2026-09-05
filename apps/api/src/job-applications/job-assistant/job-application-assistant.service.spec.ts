import type { JobApplicationAssistantOperation } from '@antin-os/shared';
import { HttpException } from '@nestjs/common';
import { JobApplicationStatus as PrismaJobApplicationStatus } from '@prisma/client';
import type { PrismaService } from '@prisma/prisma.service';
import type { AiDraftingConfig } from '@src/ai-drafting/ai-drafting.config';
import { AiDraftingError } from '@src/ai-drafting/ai-drafting.error';
import { AiDraftingLimiter } from '@src/ai-drafting/ai-drafting.limiter';
import { AiDraftingService } from '@src/ai-drafting/ai-drafting.service';
import type {
  StructuredAiProvider,
  StructuredAiProviderRequest,
} from '@src/ai-drafting/structured-ai.provider';
import { JobApplicationAssistantService } from './job-application-assistant.service';

const now = new Date('2026-08-27T08:00:00.000Z');

function createPrisma() {
  return {
    jobApplication: {
      findUnique: jest.fn().mockResolvedValue({
        id: 'job-1',
        company: 'Acme',
        position: 'Product Engineer',
        jobDescription: 'Build TypeScript services and reliable interfaces.',
        status: PrismaJobApplicationStatus.SAVED,
        applicationDate: null,
        interviewDate: null,
        nextActionDate: null,
        updatedAt: now,
      }),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    profile: {
      findUnique: jest.fn().mockResolvedValue({
        id: 'profile-1',
        fullName: 'Owner Name',
        headline: 'Product Engineer',
        biography: 'Builds TypeScript web applications.',
        email: 'must-not-be-selected@example.com',
      }),
      update: jest.fn(),
    },
    project: {
      findMany: jest.fn().mockResolvedValue([
        {
          id: 'project-1',
          title: 'Private Project',
          summary: 'A private workflow application.',
          description: 'Built reliable internal workflows.',
          techStack: ['TypeScript', 'React'],
          isPublic: false,
          imageKey: 'must-not-be-selected',
          caseStudy: {
            context: 'Internal workflow',
            problem: 'Manual work',
            role: 'Software Engineer',
            approach: 'Incremental delivery',
            responsibilities: ['API design'],
            technicalChallenges: ['Data consistency'],
            outcomes: ['Simpler workflow'],
            lessonsLearned: 'Validate source data.',
          },
        },
      ]),
      update: jest.fn(),
    },
    experience: {
      findMany: jest.fn().mockResolvedValue([
        {
          id: 'experience-1',
          company: 'Example Co',
          role: 'Engineer',
          startDate: new Date('2022-01-01T00:00:00.000Z'),
          endDate: null,
          isCurrent: true,
          summary: 'Builds web systems.',
          achievements: ['Delivered a TypeScript service.'],
          technologies: ['TypeScript'],
          location: 'must-not-be-selected',
        },
      ]),
      update: jest.fn(),
    },
    resume: { findUnique: jest.fn(), update: jest.fn() },
  };
}

function createConfig(
  overrides: Partial<AiDraftingConfig> = {},
): AiDraftingConfig {
  return {
    enabled: true,
    provider: 'mock',
    timeoutMs: 1_000,
    rateLimit: { max: 20, windowSeconds: 60 },
    usageLimit: { max: 100, windowSeconds: 86_400 },
    maxInputCharacters: 60_000,
    maxNotesLength: 2_000,
    maxOutputTokens: 777,
    errors: [],
    ...overrides,
  };
}

function createService(
  prisma: ReturnType<typeof createPrisma>,
  config: AiDraftingConfig,
  provider: StructuredAiProvider,
) {
  const draftingService = new AiDraftingService(
    config,
    new AiDraftingLimiter(),
    provider,
  );

  return new JobApplicationAssistantService(
    prisma as unknown as PrismaService,
    config,
    draftingService,
  );
}

const providerResult = (operation: JobApplicationAssistantOperation) => {
  if (operation === 'analyze') {
    return {
      suggestedCompany: 'Acme',
      suggestedPosition: 'Product Engineer',
      responsibilities: ['Build reliable interfaces'],
      requiredSkills: ['TypeScript'],
      preferredSkills: ['React'],
      keywords: ['TypeScript'],
      matchingQualifications: [
        {
          requirement: 'TypeScript',
          qualification: 'Confirmed technology evidence.',
          evidence: [
            {
              sourceType: 'experience',
              sourceId: 'experience-1',
              label: 'Experience: Engineer at Example Co',
              field: 'technologies',
            },
          ],
        },
      ],
      gaps: [],
      unknowns: [],
      needsConfirmation: [],
    };
  }

  if (operation === 'interviewQuestions') {
    return {
      questions: [
        {
          question: 'How have you used TypeScript?',
          suggestedAnswer: 'I used it in the cited experience.',
          evidence: [
            {
              sourceType: 'experience',
              sourceId: 'experience-1',
              label: 'Experience: Engineer at Example Co',
              field: 'technologies',
            },
          ],
          needsConfirmation: false,
        },
      ],
      needsConfirmation: [],
    };
  }

  if (operation === 'nextAction') {
    return {
      action: 'Prepare an example.',
      rationale: 'The role emphasizes reliable interfaces.',
      suggestedDate: null,
      needsConfirmation: [],
    };
  }

  return { content: `Editable ${operation} draft.`, needsConfirmation: [] };
};

describe('JobApplicationAssistantService', () => {
  it.each([
    'analyze',
    'interviewQuestions',
    'selfIntroduction',
    'coverLetter',
    'followUpMessage',
    'nextAction',
  ] satisfies JobApplicationAssistantOperation[])(
    'returns deterministic mock output for %s without provider or writes',
    async (operation) => {
      const prisma = createPrisma();
      const generate = jest.fn();
      const provider: StructuredAiProvider = { generate };
      const service = createService(prisma, createConfig(), provider);

      const first = await service.generate('job-1', { operation });
      const second = await service.generate('job-1', { operation });

      expect(first.operation).toBe(operation);
      expect(first.sourceUpdatedAt).toBe(now.toISOString());
      expect(second).toEqual(first);
      expect(generate).not.toHaveBeenCalled();
      expect(prisma.jobApplication.create).not.toHaveBeenCalled();
      expect(prisma.jobApplication.update).not.toHaveBeenCalled();
      expect(prisma.jobApplication.delete).not.toHaveBeenCalled();
      expect(prisma.profile.update).not.toHaveBeenCalled();
      expect(prisma.project.update).not.toHaveBeenCalled();
      expect(prisma.experience.update).not.toHaveBeenCalled();
      expect(prisma.resume.findUnique).not.toHaveBeenCalled();
    },
  );

  it('minimizes provider input, derives skill evidence, and applies output limits', async () => {
    const prisma = createPrisma();
    let captured: StructuredAiProviderRequest | undefined;
    const provider: StructuredAiProvider = {
      generate: jest.fn((input) => {
        captured = input;
        return Promise.resolve(providerResult('analyze'));
      }),
    };
    const service = createService(
      prisma,
      createConfig({ provider: 'openai' }),
      provider,
    );

    const response = await service.generate('job-1', {
      operation: 'analyze',
    });
    const serializedInput = captured?.serializedInput ?? '';

    expect(response).toMatchObject({
      operation: 'analyze',
      sourceUpdatedAt: now.toISOString(),
      matchingQualifications: [
        expect.objectContaining({
          evidence: [
            expect.objectContaining({
              sourceId: 'experience-1',
              field: 'technologies',
            }),
          ],
        }),
      ],
    });
    expect(captured?.maxOutputTokens).toBe(777);
    expect(serializedInput).toContain('Private Project');
    expect(serializedInput).not.toContain('isPublic');
    expect(serializedInput).not.toContain('must-not-be-selected');
    expect(serializedInput).not.toContain('email');
    expect(serializedInput).not.toContain('imageKey');
    expect(serializedInput).not.toContain('resume');
    expect(prisma.profile.findUnique).toHaveBeenCalledWith({
      where: { singletonKey: 'owner' },
      select: {
        id: true,
        fullName: true,
        headline: true,
        biography: true,
      },
    });
  });

  it('returns 404 and empty-description errors before provider execution', async () => {
    const prisma = createPrisma();
    const generate = jest.fn();
    const provider: StructuredAiProvider = { generate };
    const service = createService(
      prisma,
      createConfig({ provider: 'openai' }),
      provider,
    );

    prisma.jobApplication.findUnique.mockResolvedValueOnce(null);
    await expect(
      service.generate('missing', { operation: 'analyze' }),
    ).rejects.toMatchObject({ status: 404 });

    prisma.jobApplication.findUnique.mockResolvedValueOnce({
      ...(await createPrisma().jobApplication.findUnique()),
      jobDescription: '   ',
    });
    await expect(
      service.generate('job-1', { operation: 'analyze' }),
    ).rejects.toMatchObject({ status: 400 });

    expect(generate).not.toHaveBeenCalled();
    expect(prisma.profile.findUnique).not.toHaveBeenCalled();
  });

  it('rejects oversized normalized input without provider execution', async () => {
    const prisma = createPrisma();
    const generate = jest.fn();
    const provider: StructuredAiProvider = { generate };
    const service = createService(
      prisma,
      createConfig({ provider: 'openai', maxInputCharacters: 10 }),
      provider,
    );

    await expect(
      service.generate('job-1', { operation: 'coverLetter' }),
    ).rejects.toMatchObject({ status: 400 });
    expect(generate).not.toHaveBeenCalled();
  });

  it('maps disabled, timeout, malformed, and provider errors safely', async () => {
    const disabledPrisma = createPrisma();
    const disabledProvider: StructuredAiProvider = { generate: jest.fn() };
    const disabled = createService(
      disabledPrisma,
      createConfig({ enabled: false }),
      disabledProvider,
    );
    await expect(
      disabled.generate('job-1', { operation: 'analyze' }),
    ).rejects.toMatchObject({ status: 503 });

    for (const [error, status] of [
      [new AiDraftingError('timeout', 'secret timeout body'), 504],
      [new AiDraftingError('provider', 'secret provider body'), 502],
    ] as const) {
      const prisma = createPrisma();
      const provider: StructuredAiProvider = {
        generate: jest.fn().mockRejectedValue(error),
      };
      const service = createService(
        prisma,
        createConfig({ provider: 'openai' }),
        provider,
      );

      try {
        await service.generate('job-1', { operation: 'analyze' });
        throw new Error('Expected generation to fail');
      } catch (caught) {
        expect(caught).toBeInstanceOf(HttpException);
        expect((caught as HttpException).getStatus()).toBe(status);
        expect((caught as HttpException).message).not.toContain('secret');
      }
    }

    const malformedPrisma = createPrisma();
    const malformedProvider: StructuredAiProvider = {
      generate: jest.fn().mockResolvedValue({ incomplete: true }),
    };
    const malformed = createService(
      malformedPrisma,
      createConfig({ provider: 'openai' }),
      malformedProvider,
    );
    await expect(
      malformed.generate('job-1', { operation: 'analyze' }),
    ).rejects.toMatchObject({ status: 502 });
  });

  it('shares rate and usage limits across assistant requests', async () => {
    const ratePrisma = createPrisma();
    const provider: StructuredAiProvider = { generate: jest.fn() };
    const rateService = createService(
      ratePrisma,
      createConfig({ rateLimit: { max: 1, windowSeconds: 60 } }),
      provider,
    );

    await rateService.generate('job-1', { operation: 'analyze' });
    await expect(
      rateService.generate('job-1', { operation: 'coverLetter' }),
    ).rejects.toMatchObject({ status: 429 });

    const usagePrisma = createPrisma();
    const usageService = createService(
      usagePrisma,
      createConfig({
        rateLimit: { max: 10, windowSeconds: 60 },
        usageLimit: { max: 1, windowSeconds: 86_400 },
      }),
      provider,
    );
    await usageService.generate('job-1', { operation: 'analyze' });
    await expect(
      usageService.generate('job-1', { operation: 'coverLetter' }),
    ).rejects.toMatchObject({ status: 429 });
  });
});
