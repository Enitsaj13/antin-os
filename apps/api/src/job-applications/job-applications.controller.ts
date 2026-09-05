import {
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import type {
  JobApplicationAssistantResponse,
  JobApplicationDashboardSummary,
} from '@antin-os/shared';
import { OwnerAuthGuard } from '@src/auth/owner-auth.guard';
import { CreateJobApplicationDto } from './dto/create-job-application.dto';
import { JobApplicationAssistantDto } from './dto/job-application-assistant.dto';
import { ListJobApplicationsQueryDto } from './dto/list-job-applications-query.dto';
import { UpdateJobApplicationDto } from './dto/update-job-application.dto';
import { JobApplicationAssistantService } from './job-assistant/job-application-assistant.service';
import type { JobApplicationResponse } from './job-application-response';
import { JobApplicationsService } from './job-applications.service';

type JobApplicationOperations = {
  create(dto: CreateJobApplicationDto): Promise<JobApplicationResponse>;
  findAll(
    query: ListJobApplicationsQueryDto,
  ): Promise<JobApplicationResponse[]>;
  findOne(id: string): Promise<JobApplicationResponse>;
  update(
    id: string,
    dto: UpdateJobApplicationDto,
  ): Promise<JobApplicationResponse>;
  remove(id: string): Promise<JobApplicationResponse>;
  getDashboard(): Promise<JobApplicationDashboardSummary>;
};

type JobApplicationAssistantOperations = {
  generate(
    id: string,
    dto: JobApplicationAssistantDto,
  ): Promise<JobApplicationAssistantResponse>;
};

@Controller('job-applications')
@UseGuards(OwnerAuthGuard)
export class JobApplicationsController {
  constructor(
    @Inject(JobApplicationsService)
    private readonly jobApplicationsService: JobApplicationOperations,
    @Inject(JobApplicationAssistantService)
    private readonly jobApplicationAssistantService: JobApplicationAssistantOperations,
  ) {}

  @Post()
  create(@Body() dto: CreateJobApplicationDto) {
    return this.jobApplicationsService.create(dto);
  }

  @Get()
  findAll(@Query() query: ListJobApplicationsQueryDto) {
    return this.jobApplicationsService.findAll(query);
  }

  @Get('dashboard')
  getDashboard() {
    return this.jobApplicationsService.getDashboard();
  }

  @Post(':id/assistant')
  generateAssistant(
    @Param('id') id: string,
    @Body() dto: JobApplicationAssistantDto,
  ) {
    return this.jobApplicationAssistantService.generate(id, dto);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.jobApplicationsService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateJobApplicationDto) {
    return this.jobApplicationsService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.jobApplicationsService.remove(id);
  }
}
