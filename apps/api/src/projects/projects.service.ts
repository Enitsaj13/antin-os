import {
  BadGatewayException,
  BadRequestException,
  ConflictException,
  GatewayTimeoutException,
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import type {
  CaseStudyDraftResponse,
  ProjectCaseStudy,
  ProjectImageUpload,
} from '@antin-os/shared';
import { Prisma } from '@prisma/client';
import { PrismaService } from '@prisma/prisma.service';
import { CASE_STUDY_DRAFT_CONFIG } from './case-study-draft/case-study-draft.config';
import type { CaseStudyDraftConfig } from './case-study-draft/case-study-draft.config';
import { CaseStudyDraftLimiter } from './case-study-draft/case-study-draft.limiter';
import {
  CASE_STUDY_DRAFT_PROVIDER,
  CaseStudyDraftProviderError,
} from './case-study-draft/case-study-draft.provider';
import type { CaseStudyDraftProvider } from './case-study-draft/case-study-draft.provider';
import { CreateCaseStudyDraftDto } from './dto/create-case-study-draft.dto';
import { CreateProjectCaseStudyDto } from './dto/create-project-case-study.dto';
import { CreateProjectImageUploadDto } from './dto/create-project-image-upload.dto';
import { CreateProjectDto } from './dto/create-project.dto';
import { ReorderProjectsDto } from './dto/reorder-projects.dto';
import { UpdateProjectCaseStudyPublicationDto } from './dto/update-project-case-study-publication.dto';
import { UpdateProjectCaseStudyDto } from './dto/update-project-case-study.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import {
  ProjectCaseStudyRecord,
  ProjectWithCaseStudyRecord,
  ProjectRecord,
  ProjectResponse,
  projectCaseStudySelect,
  projectSelect,
  toProjectCaseStudyResponse,
  toProjectResponse,
} from './project-response';
import { PROJECT_IMAGE_STORAGE } from './storage/project-image-storage';
import type { ProjectImageStorage } from './storage/project-image-storage';

type ProjectCreateData = Pick<
  Prisma.ProjectCreateInput,
  | 'title'
  | 'slug'
  | 'summary'
  | 'description'
  | 'techStack'
  | 'repoUrl'
  | 'liveUrl'
  | 'imageUrl'
  | 'imageKey'
  | 'isPublic'
  | 'displayOrder'
>;

type ProjectUpdateData = Partial<ProjectCreateData>;

type ProjectCaseStudyCreateData = Pick<
  Prisma.ProjectCaseStudyUncheckedCreateInput,
  | 'projectId'
  | 'context'
  | 'problem'
  | 'role'
  | 'approach'
  | 'responsibilities'
  | 'technicalChallenges'
  | 'outcomes'
  | 'lessonsLearned'
  | 'isPublic'
>;

type ProjectCaseStudyUpdateData = Partial<
  Omit<ProjectCaseStudyCreateData, 'projectId'>
>;

const PROJECT_ORDER = [
  { displayOrder: 'asc' },
  { createdAt: 'desc' },
  { updatedAt: 'desc' },
] satisfies Prisma.ProjectOrderByWithRelationInput[];

@Injectable()
export class ProjectsService {
  private readonly logger = new Logger(ProjectsService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject(PROJECT_IMAGE_STORAGE)
    private readonly projectImageStorage: ProjectImageStorage,
    @Inject(CASE_STUDY_DRAFT_CONFIG)
    private readonly caseStudyDraftConfig: CaseStudyDraftConfig,
    @Inject(CASE_STUDY_DRAFT_PROVIDER)
    private readonly caseStudyDraftProvider: CaseStudyDraftProvider,
    private readonly caseStudyDraftLimiter: CaseStudyDraftLimiter,
  ) {}

  async create(dto: CreateProjectDto): Promise<ProjectResponse> {
    const nextDisplayOrder = await this.nextDisplayOrder();

    try {
      const project = await this.prisma.project.create({
        data: {
          title: dto.title,
          slug: dto.slug,
          summary: dto.summary,
          description: dto.description,
          techStack: dto.techStack,
          repoUrl: dto.repoUrl,
          liveUrl: dto.liveUrl,
          imageUrl: dto.imageUrl,

          imageKey: dto.imageKey,
          isPublic: dto.isPublic ?? false,
          displayOrder: nextDisplayOrder,
        } satisfies ProjectCreateData,
        select: projectSelect,
      });

      return this.toResponse(project);
    } catch (error) {
      this.handlePrismaWriteError(error);
    }
  }

  async findAllManaged(): Promise<ProjectResponse[]> {
    const projects = await this.prisma.project.findMany({
      orderBy: PROJECT_ORDER,
      select: projectSelect,
    });

    return Promise.all(projects.map((project) => this.toResponse(project)));
  }

  async findManaged(idOrSlug: string): Promise<ProjectResponse> {
    const project = await this.prisma.project.findFirst({
      where: {
        OR: [{ id: idOrSlug }, { slug: idOrSlug }],
      },
      select: {
        ...projectSelect,
        caseStudy: { select: projectCaseStudySelect },
      },
    });

    return this.toResponse(this.requireProject(project));
  }

  async update(id: string, dto: UpdateProjectDto): Promise<ProjectResponse> {
    const data = this.toUpdateData(dto);

    if (Object.keys(data).length === 0) {
      throw new BadRequestException(
        'Update request must include at least one field',
      );
    }

    await this.ensureExists(id);

    try {
      const project = await this.prisma.project.update({
        where: { id },
        data,
        select: projectSelect,
      });

      return this.toResponse(project);
    } catch (error) {
      this.handlePrismaWriteError(error);
    }
  }

  async remove(id: string): Promise<ProjectResponse> {
    await this.ensureExists(id);

    const project = await this.prisma.project.delete({
      where: { id },
      select: projectSelect,
    });

    if (project.imageKey) {
      void this.projectImageStorage.delete(project.imageKey).catch((error) => {
        this.logger.error(
          `Failed to delete project image ${project.imageKey}`,
          error,
        );
      });
    }

    return toProjectResponse(project);
  }

  async reorder(dto: ReorderProjectsDto): Promise<ProjectResponse[]> {
    const ids = dto.items.map((item) => item.id);
    const uniqueIds = new Set(ids);

    if (uniqueIds.size !== ids.length) {
      throw new BadRequestException('Project ids must be unique');
    }

    const existing = await this.prisma.project.findMany({
      where: { id: { in: ids } },
      select: { id: true },
    });

    if (existing.length !== ids.length) {
      throw new BadRequestException('Project reorder includes unknown ids');
    }

    await this.prisma.$transaction(
      dto.items.map((item) =>
        this.prisma.project.update({
          where: { id: item.id },
          data: { displayOrder: item.displayOrder },
          select: { id: true },
        }),
      ),
    );

    return this.findAllManaged();
  }

  createImageUpload(
    dto: CreateProjectImageUploadDto,
  ): Promise<ProjectImageUpload> {
    return this.projectImageStorage.createUpload({
      fileName: dto.fileName,
      contentType: dto.contentType,
    });
  }

  async findAllPublic(): Promise<ProjectResponse[]> {
    const projects = await this.prisma.project.findMany({
      where: { isPublic: true },
      orderBy: PROJECT_ORDER,
      select: projectSelect,
    });

    return Promise.all(projects.map((project) => this.toResponse(project)));
  }

  async findPublicBySlug(slug: string): Promise<ProjectResponse> {
    const project = await this.prisma.project.findFirst({
      where: { slug, isPublic: true },
      select: {
        ...projectSelect,
        caseStudy: { select: projectCaseStudySelect },
      },
    });

    const response = await this.toResponse(this.requireProject(project));

    if (response.caseStudy && !response.caseStudy.isPublic) {
      response.caseStudy = null;
    }

    return response;
  }

  async findCaseStudy(projectId: string): Promise<ProjectCaseStudy> {
    await this.ensureExists(projectId);

    const caseStudy = await this.prisma.projectCaseStudy.findUnique({
      where: { projectId },
      select: projectCaseStudySelect,
    });

    return toProjectCaseStudyResponse(this.requireCaseStudy(caseStudy));
  }

  async createCaseStudy(
    projectId: string,
    dto: CreateProjectCaseStudyDto,
  ): Promise<ProjectCaseStudy> {
    await this.ensureExists(projectId);

    try {
      const caseStudy = await this.prisma.projectCaseStudy.create({
        data: {
          projectId,
          context: dto.context,
          problem: dto.problem,
          role: dto.role,
          approach: dto.approach,
          responsibilities: dto.responsibilities ?? [],
          technicalChallenges: dto.technicalChallenges ?? [],
          outcomes: dto.outcomes ?? [],
          lessonsLearned: dto.lessonsLearned ?? null,
          isPublic: dto.isPublic ?? false,
        } satisfies ProjectCaseStudyCreateData,
        select: projectCaseStudySelect,
      });

      return toProjectCaseStudyResponse(caseStudy);
    } catch (error) {
      this.handleCaseStudyWriteError(error);
    }
  }

  async createCaseStudyDraft(
    projectId: string,
    dto: CreateCaseStudyDraftDto,
  ): Promise<CaseStudyDraftResponse> {
    this.ensureDraftingConfigured();

    const notes = dto.notes?.trim();

    if (notes && notes.length > this.caseStudyDraftConfig.maxNotesLength) {
      throw new BadRequestException(
        `Owner notes must be ${this.caseStudyDraftConfig.maxNotesLength} characters or fewer`,
      );
    }

    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      select: {
        id: true,
        title: true,
        slug: true,
        summary: true,
        description: true,
        techStack: true,
        repoUrl: true,
        liveUrl: true,
        isPublic: true,
      },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    const limitResult = this.caseStudyDraftLimiter.consume(
      this.caseStudyDraftConfig.rateLimit,
      this.caseStudyDraftConfig.usageLimit,
    );

    if (limitResult === 'rate-limit') {
      throw new HttpException(
        'AI draft generation rate limit exceeded',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    if (limitResult === 'usage-limit') {
      throw new HttpException(
        'AI draft generation usage limit exceeded',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    const abortController = new AbortController();
    const timeout = setTimeout(
      () => abortController.abort(),
      this.caseStudyDraftConfig.timeoutMs,
    );

    try {
      const draft = await this.caseStudyDraftProvider.generate({
        project,
        notes: notes || undefined,
        maxOutputTokens: this.caseStudyDraftConfig.maxOutputTokens,
        signal: abortController.signal,
      });

      return { draft };
    } catch (error) {
      this.handleDraftProviderError(error);
    } finally {
      clearTimeout(timeout);
    }
  }

  async updateCaseStudy(
    projectId: string,
    dto: UpdateProjectCaseStudyDto,
  ): Promise<ProjectCaseStudy> {
    await this.ensureExists(projectId);
    const data = this.toCaseStudyUpdateData(dto);

    if (Object.keys(data).length === 0) {
      throw new BadRequestException(
        'Update request must include at least one field',
      );
    }

    try {
      const caseStudy = await this.prisma.projectCaseStudy.update({
        where: { projectId },
        data,
        select: projectCaseStudySelect,
      });

      return toProjectCaseStudyResponse(caseStudy);
    } catch (error) {
      this.handleCaseStudyWriteError(error);
    }
  }

  async updateCaseStudyPublication(
    projectId: string,
    dto: UpdateProjectCaseStudyPublicationDto,
  ): Promise<ProjectCaseStudy> {
    return this.updateCaseStudy(projectId, { isPublic: dto.isPublic });
  }

  async removeCaseStudy(projectId: string): Promise<ProjectCaseStudy> {
    await this.ensureExists(projectId);

    try {
      const caseStudy = await this.prisma.projectCaseStudy.delete({
        where: { projectId },
        select: projectCaseStudySelect,
      });

      return toProjectCaseStudyResponse(caseStudy);
    } catch (error) {
      this.handleCaseStudyWriteError(error);
    }
  }

  private toUpdateData(dto: UpdateProjectDto): ProjectUpdateData {
    const data: ProjectUpdateData = {};

    for (const key of [
      'title',
      'slug',
      'summary',
      'description',
      'techStack',
      'repoUrl',
      'liveUrl',
      'imageUrl',
      'imageKey',
      'isPublic',
    ] as const) {
      const value = dto[key];

      if (value !== undefined) {
        data[key] = value as never;
      }
    }

    return data;
  }

  private async ensureExists(id: string): Promise<void> {
    const existing = await this.prisma.project.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!existing) {
      throw new NotFoundException('Project not found');
    }
  }

  private async nextDisplayOrder(): Promise<number> {
    const result = await this.prisma.project.aggregate({
      _max: { displayOrder: true },
    });

    return (result._max.displayOrder ?? -1) + 1;
  }

  private requireProject(
    project: ProjectWithCaseStudyRecord | ProjectRecord | null,
  ): ProjectWithCaseStudyRecord | ProjectRecord {
    if (!project) {
      throw new NotFoundException('Project not found');
    }

    return project;
  }

  private requireCaseStudy(
    caseStudy: ProjectCaseStudyRecord | null,
  ): ProjectCaseStudyRecord {
    if (!caseStudy) {
      throw new NotFoundException('Project case study not found');
    }

    return caseStudy;
  }

  private async toResponse(
    project: ProjectWithCaseStudyRecord | ProjectRecord,
  ): Promise<ProjectResponse> {
    const response = toProjectResponse(project);

    if (!project.imageKey) {
      return response;
    }

    return {
      ...response,
      imageUrl: await this.projectImageStorage.getUrl(project.imageKey),
    };
  }

  private handlePrismaWriteError(error: unknown): never {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      throw new ConflictException('Project slug already exists');
    }

    throw error;
  }

  private ensureDraftingConfigured(): void {
    if (!this.caseStudyDraftConfig.enabled) {
      throw new ServiceUnavailableException('AI drafting is disabled');
    }

    if (this.caseStudyDraftConfig.errors.length > 0) {
      throw new ServiceUnavailableException(
        'AI drafting configuration is incomplete',
      );
    }
  }

  private handleDraftProviderError(error: unknown): never {
    if (error instanceof CaseStudyDraftProviderError) {
      if (error.code === 'timeout') {
        throw new GatewayTimeoutException('AI draft generation timed out');
      }

      if (error.code === 'configuration') {
        throw new ServiceUnavailableException(
          'AI drafting configuration is incomplete',
        );
      }

      if (error.code === 'malformed') {
        throw new BadGatewayException('AI provider returned a malformed draft');
      }

      throw new BadGatewayException('AI provider could not generate a draft');
    }

    throw new BadGatewayException('AI provider could not generate a draft');
  }

  private toCaseStudyUpdateData(
    dto: UpdateProjectCaseStudyDto,
  ): ProjectCaseStudyUpdateData {
    const data: ProjectCaseStudyUpdateData = {};

    if (dto.context !== undefined) {
      data.context = dto.context;
    }

    if (dto.problem !== undefined) {
      data.problem = dto.problem;
    }

    if (dto.role !== undefined) {
      data.role = dto.role;
    }

    if (dto.approach !== undefined) {
      data.approach = dto.approach;
    }

    if (dto.responsibilities !== undefined) {
      data.responsibilities = dto.responsibilities;
    }

    if (dto.technicalChallenges !== undefined) {
      data.technicalChallenges = dto.technicalChallenges;
    }

    if (dto.outcomes !== undefined) {
      data.outcomes = dto.outcomes;
    }

    if (dto.lessonsLearned !== undefined) {
      data.lessonsLearned = dto.lessonsLearned;
    }

    if (dto.isPublic !== undefined) {
      data.isPublic = dto.isPublic;
    }

    return data;
  }

  private handleCaseStudyWriteError(error: unknown): never {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        throw new ConflictException('Project case study already exists');
      }

      if (error.code === 'P2025') {
        throw new NotFoundException('Project case study not found');
      }
    }

    throw error;
  }
}
