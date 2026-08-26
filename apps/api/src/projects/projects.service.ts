import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import type { ProjectCaseStudy, ProjectImageUpload } from '@antin-os/shared';
import { Prisma } from '@prisma/client';
import { PrismaService } from '@prisma/prisma.service';
import { CreateProjectCaseStudyDto } from './dto/create-project-case-study.dto';
import { CreateProjectImageUploadDto } from './dto/create-project-image-upload.dto';
import { CreateProjectDto } from './dto/create-project.dto';
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

@Injectable()
export class ProjectsService {
  private readonly logger = new Logger(ProjectsService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject(PROJECT_IMAGE_STORAGE)
    private readonly projectImageStorage: ProjectImageStorage,
  ) {}

  async create(dto: CreateProjectDto): Promise<ProjectResponse> {
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
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          imageKey: dto.imageKey,
          isPublic: dto.isPublic ?? false,
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
      orderBy: { createdAt: 'desc' },
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
      orderBy: { createdAt: 'desc' },
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
