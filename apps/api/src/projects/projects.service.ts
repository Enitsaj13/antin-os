import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import type { ProjectImageUpload } from '@antin-os/shared';
import { Prisma } from '@prisma/client';
import { PrismaService } from '@prisma/prisma.service';
import { CreateProjectImageUploadDto } from './dto/create-project-image-upload.dto';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import {
  ProjectRecord,
  ProjectResponse,
  projectSelect,
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
      select: projectSelect,
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
      select: projectSelect,
    });

    return this.toResponse(this.requireProject(project));
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

  private requireProject(project: ProjectRecord | null): ProjectRecord {
    if (!project) {
      throw new NotFoundException('Project not found');
    }

    return project;
  }

  private async toResponse(project: ProjectRecord): Promise<ProjectResponse> {
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
}
