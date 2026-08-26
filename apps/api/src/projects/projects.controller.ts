import {
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import type { ProjectImageUpload } from '@antin-os/shared';
import type { ProjectCaseStudy } from '@antin-os/shared';
import { OwnerAuthGuard } from '@src/auth/owner-auth.guard';
import { CreateProjectCaseStudyDto } from './dto/create-project-case-study.dto';
import { CreateProjectImageUploadDto } from './dto/create-project-image-upload.dto';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectCaseStudyPublicationDto } from './dto/update-project-case-study-publication.dto';
import { UpdateProjectCaseStudyDto } from './dto/update-project-case-study.dto';
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
  findCaseStudy(projectId: string): Promise<ProjectCaseStudy>;
  createCaseStudy(
    projectId: string,
    dto: CreateProjectCaseStudyDto,
  ): Promise<ProjectCaseStudy>;
  updateCaseStudy(
    projectId: string,
    dto: UpdateProjectCaseStudyDto,
  ): Promise<ProjectCaseStudy>;
  updateCaseStudyPublication(
    projectId: string,
    dto: UpdateProjectCaseStudyPublicationDto,
  ): Promise<ProjectCaseStudy>;
  removeCaseStudy(projectId: string): Promise<ProjectCaseStudy>;
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
  @UseGuards(OwnerAuthGuard)
  create(@Body() dto: CreateProjectDto): Promise<ProjectResponse> {
    return this.projectsService.create(dto);
  }

  @Get('projects')
  @UseGuards(OwnerAuthGuard)
  findAllManaged(): Promise<ProjectResponse[]> {
    return this.projectsService.findAllManaged();
  }

  @Get('projects/:idOrSlug')
  @UseGuards(OwnerAuthGuard)
  findManaged(@Param('idOrSlug') idOrSlug: string): Promise<ProjectResponse> {
    return this.projectsService.findManaged(idOrSlug);
  }

  @Patch('projects/:id')
  @UseGuards(OwnerAuthGuard)
  update(
    @Param('id') id: string,
    @Body() dto: UpdateProjectDto,
  ): Promise<ProjectResponse> {
    return this.projectsService.update(id, dto);
  }

  @Delete('projects/:id')
  @UseGuards(OwnerAuthGuard)
  remove(@Param('id') id: string): Promise<ProjectResponse> {
    return this.projectsService.remove(id);
  }

  @Post('projects/image-upload')
  @UseGuards(OwnerAuthGuard)
  createImageUpload(
    @Body() dto: CreateProjectImageUploadDto,
  ): Promise<ProjectImageUpload> {
    return this.projectsService.createImageUpload(dto);
  }

  @Get('projects/:projectId/case-study')
  @UseGuards(OwnerAuthGuard)
  findCaseStudy(
    @Param('projectId') projectId: string,
  ): Promise<ProjectCaseStudy> {
    return this.projectsService.findCaseStudy(projectId);
  }

  @Post('projects/:projectId/case-study')
  @UseGuards(OwnerAuthGuard)
  createCaseStudy(
    @Param('projectId') projectId: string,
    @Body() dto: CreateProjectCaseStudyDto,
  ): Promise<ProjectCaseStudy> {
    return this.projectsService.createCaseStudy(projectId, dto);
  }

  @Patch('projects/:projectId/case-study')
  @UseGuards(OwnerAuthGuard)
  updateCaseStudy(
    @Param('projectId') projectId: string,
    @Body() dto: UpdateProjectCaseStudyDto,
  ): Promise<ProjectCaseStudy> {
    return this.projectsService.updateCaseStudy(projectId, dto);
  }

  @Patch('projects/:projectId/case-study/publication')
  @UseGuards(OwnerAuthGuard)
  updateCaseStudyPublication(
    @Param('projectId') projectId: string,
    @Body() dto: UpdateProjectCaseStudyPublicationDto,
  ): Promise<ProjectCaseStudy> {
    return this.projectsService.updateCaseStudyPublication(projectId, dto);
  }

  @Delete('projects/:projectId/case-study')
  @UseGuards(OwnerAuthGuard)
  removeCaseStudy(
    @Param('projectId') projectId: string,
  ): Promise<ProjectCaseStudy> {
    return this.projectsService.removeCaseStudy(projectId);
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
