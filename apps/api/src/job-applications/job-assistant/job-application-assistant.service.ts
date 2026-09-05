import type {
  JobApplicationAssistantResponse,
  JobApplicationEvidenceReference,
} from '@antin-os/shared';
import {
  BadGatewayException,
  BadRequestException,
  GatewayTimeoutException,
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { PrismaService } from '@prisma/prisma.service';
import {
  AI_DRAFTING_CONFIG,
  type AiDraftingConfig,
} from '@src/ai-drafting/ai-drafting.config';
import { AiDraftingError } from '@src/ai-drafting/ai-drafting.error';
import { AiDraftingService } from '@src/ai-drafting/ai-drafting.service';
import { PROFILE_SINGLETON_KEY } from '@src/profile/profile.constants';
import { JobApplicationAssistantDto } from '../dto/job-application-assistant.dto';
import { toApiJobApplicationStatus } from '../job-application-response';
import { jobApplicationAssistantInstructions } from './job-application-assistant.instructions';
import { normalizeJobApplicationAssistantResult } from './job-application-assistant.normalizer';
import { jobApplicationAssistantSchema } from './job-application-assistant.schema';
import type {
  JobAssistantGenerationRequest,
  JobAssistantSource,
} from './job-application-assistant.types';
import { createMockJobApplicationAssistantResult } from './mock-job-application-assistant';

const MAX_SOURCE_TEXT_CHARACTERS = 10_000;
const MAX_SOURCE_ARRAY_ITEMS = 100;
const MAX_SOURCE_ARRAY_ITEM_CHARACTERS = 2_000;

const jobSourceSelect = {
  id: true,
  company: true,
  position: true,
  jobDescription: true,
  status: true,
  applicationDate: true,
  interviewDate: true,
  nextActionDate: true,
  updatedAt: true,
} as const;

const profileSourceSelect = {
  id: true,
  fullName: true,
  headline: true,
  biography: true,
} as const;

const projectSourceSelect = {
  id: true,
  title: true,
  summary: true,
  description: true,
  techStack: true,
  caseStudy: {
    select: {
      context: true,
      problem: true,
      role: true,
      approach: true,
      responsibilities: true,
      technicalChallenges: true,
      outcomes: true,
      lessonsLearned: true,
    },
  },
} as const;

const experienceSourceSelect = {
  id: true,
  company: true,
  role: true,
  startDate: true,
  endDate: true,
  isCurrent: true,
  summary: true,
  achievements: true,
  technologies: true,
} as const;

@Injectable()
export class JobApplicationAssistantService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(AI_DRAFTING_CONFIG)
    private readonly config: AiDraftingConfig,
    private readonly aiDraftingService: AiDraftingService,
  ) {}

  async generate(
    id: string,
    dto: JobApplicationAssistantDto,
  ): Promise<JobApplicationAssistantResponse> {
    const application = await this.prisma.jobApplication.findUnique({
      where: { id },
      select: jobSourceSelect,
    });

    if (!application) {
      throw new NotFoundException('Job application not found');
    }

    const jobDescription = application.jobDescription?.trim();

    if (!jobDescription) {
      throw new BadRequestException(
        'Save a job description before using the AI assistant',
      );
    }

    const [profile, projects, experience] = await Promise.all([
      this.prisma.profile.findUnique({
        where: { singletonKey: PROFILE_SINGLETON_KEY },
        select: profileSourceSelect,
      }),
      this.prisma.project.findMany({
        orderBy: [{ displayOrder: 'asc' }, { createdAt: 'desc' }],
        select: projectSourceSelect,
      }),
      this.prisma.experience.findMany({
        orderBy: [{ displayOrder: 'asc' }, { startDate: 'desc' }],
        select: experienceSourceSelect,
      }),
    ]);

    const source: JobAssistantSource = {
      jobApplication: {
        id: application.id,
        company: application.company,
        position: application.position,
        jobDescription,
        status: toApiJobApplicationStatus(application.status),
        applicationDate: application.applicationDate?.toISOString() ?? null,
        interviewDate: application.interviewDate?.toISOString() ?? null,
        nextActionDate: application.nextActionDate?.toISOString() ?? null,
      },
      profile: profile
        ? {
            id: profile.id,
            fullName: profile.fullName,
            headline: profile.headline,
            biography: profile.biography,
          }
        : null,
      projects: projects.map((project) => ({
        id: project.id,
        title: project.title,
        summary: project.summary,
        description: project.description,
        techStack: project.techStack,
        caseStudy: project.caseStudy
          ? {
              context: project.caseStudy.context,
              problem: project.caseStudy.problem,
              role: project.caseStudy.role,
              approach: project.caseStudy.approach,
              responsibilities: project.caseStudy.responsibilities,
              technicalChallenges: project.caseStudy.technicalChallenges,
              outcomes: project.caseStudy.outcomes,
              lessonsLearned: project.caseStudy.lessonsLearned,
            }
          : null,
      })),
      experience: experience.map((item) => ({
        id: item.id,
        company: item.company,
        role: item.role,
        startDate: item.startDate.toISOString(),
        endDate: item.endDate?.toISOString() ?? null,
        isCurrent: item.isCurrent,
        summary: item.summary,
        achievements: item.achievements,
        technologies: item.technologies,
      })),
    };

    this.assertSourceBounds(source);
    const evidence = this.createEvidenceReferences(source);
    const request: JobAssistantGenerationRequest = {
      operation: dto.operation,
      source,
      evidence,
    };

    try {
      const result = await this.aiDraftingService.generate({
        schemaName: `job_application_assistant_${dto.operation}`,
        schemaDescription:
          'A private, evidence-grounded job-application assistant result for owner review.',
        schema: jobApplicationAssistantSchema(dto.operation),
        instructions: jobApplicationAssistantInstructions(dto.operation),
        input: request,
        normalize: (value) =>
          normalizeJobApplicationAssistantResult(
            dto.operation,
            value,
            evidence,
          ),
        createMock: () => createMockJobApplicationAssistantResult(request),
      });

      return {
        ...result,
        sourceUpdatedAt: application.updatedAt.toISOString(),
      };
    } catch (error) {
      this.handleDraftingError(error);
    }
  }

  private createEvidenceReferences(
    source: JobAssistantSource,
  ): JobApplicationEvidenceReference[] {
    const evidence: JobApplicationEvidenceReference[] = [];

    if (source.profile) {
      for (const field of ['headline', 'biography'] as const) {
        if (source.profile[field].trim()) {
          evidence.push({
            sourceType: 'profile',
            sourceId: source.profile.id,
            label: `Profile: ${source.profile.fullName}`,
            field,
          });
        }
      }
    }

    for (const project of source.projects) {
      const label = `Project: ${project.title}`;

      for (const field of ['summary', 'description', 'techStack'] as const) {
        const value = project[field];

        if (Array.isArray(value) ? value.length > 0 : Boolean(value?.trim())) {
          evidence.push({
            sourceType: 'project',
            sourceId: project.id,
            label,
            field,
          });
        }
      }

      if (project.caseStudy) {
        for (const field of [
          'context',
          'problem',
          'role',
          'approach',
          'responsibilities',
          'technicalChallenges',
          'outcomes',
          'lessonsLearned',
        ] as const) {
          const value = project.caseStudy[field];

          if (
            Array.isArray(value) ? value.length > 0 : Boolean(value?.trim())
          ) {
            evidence.push({
              sourceType: 'project',
              sourceId: project.id,
              label,
              field: `caseStudy.${field}`,
            });
          }
        }
      }
    }

    for (const item of source.experience) {
      for (const field of ['achievements', 'technologies'] as const) {
        if (item[field].length > 0) {
          evidence.push({
            sourceType: 'experience',
            sourceId: item.id,
            label: `Experience: ${item.role} at ${item.company}`,
            field,
          });
        }
      }
    }

    return evidence;
  }

  private assertSourceBounds(source: JobAssistantSource): void {
    const inspect = (value: unknown, path: string): void => {
      if (typeof value === 'string') {
        const maximum =
          path === 'jobApplication.jobDescription'
            ? 30_000
            : MAX_SOURCE_TEXT_CHARACTERS;

        if (value.length > maximum) {
          throw new BadRequestException(
            `AI assistant source field ${path} exceeds its ${maximum}-character limit`,
          );
        }

        return;
      }

      if (Array.isArray(value)) {
        if (value.length > MAX_SOURCE_ARRAY_ITEMS) {
          throw new BadRequestException(
            `AI assistant source field ${path} exceeds its ${MAX_SOURCE_ARRAY_ITEMS}-item limit`,
          );
        }

        value.forEach((item, index) => {
          if (
            typeof item === 'string' &&
            item.length > MAX_SOURCE_ARRAY_ITEM_CHARACTERS
          ) {
            throw new BadRequestException(
              `AI assistant source field ${path}[${index}] exceeds its ${MAX_SOURCE_ARRAY_ITEM_CHARACTERS}-character limit`,
            );
          }

          inspect(item, `${path}[${index}]`);
        });
        return;
      }

      if (value && typeof value === 'object') {
        for (const [key, item] of Object.entries(value)) {
          inspect(item, path ? `${path}.${key}` : key);
        }
      }
    };

    inspect(source, '');
  }

  private handleDraftingError(error: unknown): never {
    if (error instanceof AiDraftingError) {
      if (error.code === 'disabled') {
        throw new ServiceUnavailableException('AI assistant is disabled');
      }

      if (error.code === 'configuration') {
        throw new ServiceUnavailableException(
          'AI assistant configuration is incomplete',
        );
      }

      if (error.code === 'input-length') {
        throw new BadRequestException(
          `AI assistant input must be ${this.config.maxInputCharacters} characters or fewer`,
        );
      }

      if (error.code === 'rate-limit') {
        throw new HttpException(
          'AI assistant rate limit exceeded',
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }

      if (error.code === 'usage-limit') {
        throw new HttpException(
          'AI assistant usage limit exceeded',
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }

      if (error.code === 'timeout') {
        throw new GatewayTimeoutException('AI assistant request timed out');
      }

      if (error.code === 'malformed') {
        throw new BadGatewayException(
          'AI provider returned a malformed assistant response',
        );
      }
    }

    throw new BadGatewayException(
      'AI provider could not generate an assistant response',
    );
  }
}
