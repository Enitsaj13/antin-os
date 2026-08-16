import {
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import type { ProjectImageUpload } from '@antin-os/shared';
import { CreateProjectImageUploadDto } from './dto/create-project-image-upload.dto';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import type { ProjectResponse } from './project-response';
import { ProjectsService } from './projects.service';

type ProjectsOperations = {
  create(dto: CreateProjectDto): Promise<ProjectResponse>;
  findAllManaged(): Promise<ProjectResponse[]>;
  findManaged(idOrSlug: string): Promise<ProjectResponse>;
  update(id: string, dto: UpdateProjectDto): Promise<ProjectResponse>;
  remove(id: string): Promise<ProjectResponse>;
  createImageUpload(
    dto: CreateProjectImageUploadDto,
  ): Promise<ProjectImageUpload>;
  findAllPublic(): Promise<ProjectResponse[]>;
  findPublicBySlug(slug: string): Promise<ProjectResponse>;
};

@Controller()
export class ProjectsController {
  constructor(
    @Inject(ProjectsService)
    private readonly projectsService: ProjectsOperations,
  ) {}

  @Post('projects')
  create(@Body() dto: CreateProjectDto): Promise<ProjectResponse> {
    return this.projectsService.create(dto);
  }

  @Get('projects')
  findAllManaged(): Promise<ProjectResponse[]> {
    return this.projectsService.findAllManaged();
  }

  @Get('projects/:idOrSlug')
  findManaged(@Param('idOrSlug') idOrSlug: string): Promise<ProjectResponse> {
    return this.projectsService.findManaged(idOrSlug);
  }

  @Patch('projects/:id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateProjectDto,
  ): Promise<ProjectResponse> {
    return this.projectsService.update(id, dto);
  }

  @Delete('projects/:id')
  remove(@Param('id') id: string): Promise<ProjectResponse> {
    return this.projectsService.remove(id);
  }

  @Post('projects/image-upload')
  createImageUpload(
    @Body() dto: CreateProjectImageUploadDto,
  ): Promise<ProjectImageUpload> {
    return this.projectsService.createImageUpload(dto);
  }

  @Get('public/projects')
  findAllPublic(): Promise<ProjectResponse[]> {
    return this.projectsService.findAllPublic();
  }

  @Get('public/projects/:slug')
  findPublicBySlug(@Param('slug') slug: string): Promise<ProjectResponse> {
    return this.projectsService.findPublicBySlug(slug);
  }
}
