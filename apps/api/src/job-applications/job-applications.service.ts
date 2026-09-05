import {
  JOB_APPLICATION_STATUSES,
  type JobApplicationDashboardSummary,
  type JobApplicationStatus,
} from '@antin-os/shared';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  JobApplicationStatus as PrismaJobApplicationStatus,
  Prisma,
} from '@prisma/client';
import { PrismaService } from '@prisma/prisma.service';
import { CreateJobApplicationDto } from './dto/create-job-application.dto';
import { ListJobApplicationsQueryDto } from './dto/list-job-applications-query.dto';
import { UpdateJobApplicationDto } from './dto/update-job-application.dto';
import {
  JobApplicationRecord,
  JobApplicationResponse,
  jobApplicationSelect,
  toApiJobApplicationStatus,
  toJobApplicationResponse,
} from './job-application-response';

const STATUS_TO_PRISMA: Record<
  JobApplicationStatus,
  PrismaJobApplicationStatus
> = {
  saved: PrismaJobApplicationStatus.SAVED,
  applied: PrismaJobApplicationStatus.APPLIED,
  screening: PrismaJobApplicationStatus.SCREENING,
  interview: PrismaJobApplicationStatus.INTERVIEW,
  offer: PrismaJobApplicationStatus.OFFER,
  rejected: PrismaJobApplicationStatus.REJECTED,
  withdrawn: PrismaJobApplicationStatus.WITHDRAWN,
};

const OPTIONAL_TEXT_FIELDS = [
  'jobUrl',
  'source',
  'salaryRange',
  'jobDescription',
  'notes',
  'followUpNotes',
] as const;

const DATE_FIELDS = [
  'applicationDate',
  'interviewDate',
  'nextActionDate',
] as const;

@Injectable()
export class JobApplicationsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateJobApplicationDto): Promise<JobApplicationResponse> {
    const application = await this.prisma.jobApplication.create({
      data: {
        company: dto.company,
        position: dto.position,
        jobUrl: dto.jobUrl ?? null,
        source: dto.source ?? null,
        salaryRange: dto.salaryRange ?? null,
        jobDescription: dto.jobDescription ?? null,
        notes: dto.notes ?? null,
        status: STATUS_TO_PRISMA[dto.status ?? 'saved'],
        applicationDate: this.parseNullableDate(dto.applicationDate),
        interviewDate: this.parseNullableDate(dto.interviewDate),
        nextActionDate: this.parseNullableDate(dto.nextActionDate),
        followUpNotes: dto.followUpNotes ?? null,
      },
      select: jobApplicationSelect,
    });

    return toJobApplicationResponse(application);
  }

  async findAll(
    query: ListJobApplicationsQueryDto,
  ): Promise<JobApplicationResponse[]> {
    const where: Prisma.JobApplicationWhereInput = {};

    if (query.status) {
      where.status = STATUS_TO_PRISMA[query.status];
    }

    if (query.search) {
      where.OR = [
        'company',
        'position',
        'source',
        'salaryRange',
        'jobDescription',
      ].map((field) => ({
        [field]: {
          contains: query.search,
          mode: 'insensitive',
        },
      }));
    }

    const applications = await this.prisma.jobApplication.findMany({
      where,
      orderBy: [{ updatedAt: 'desc' }, { createdAt: 'desc' }],
      select: jobApplicationSelect,
    });

    return applications.map(toJobApplicationResponse);
  }

  async findOne(id: string): Promise<JobApplicationResponse> {
    return toJobApplicationResponse(await this.findRecord(id));
  }

  async update(
    id: string,
    dto: UpdateJobApplicationDto,
  ): Promise<JobApplicationResponse> {
    const data = this.toUpdateData(dto);

    if (Object.keys(data).length === 0) {
      throw new BadRequestException(
        'Update request must include at least one field',
      );
    }

    await this.ensureExists(id);

    const application = await this.prisma.jobApplication.update({
      where: { id },
      data,
      select: jobApplicationSelect,
    });

    return toJobApplicationResponse(application);
  }

  async remove(id: string): Promise<JobApplicationResponse> {
    await this.ensureExists(id);

    const application = await this.prisma.jobApplication.delete({
      where: { id },
      select: jobApplicationSelect,
    });

    return toJobApplicationResponse(application);
  }

  async getDashboard(): Promise<JobApplicationDashboardSummary> {
    const groups = await this.prisma.jobApplication.groupBy({
      by: ['status'],
      _count: { _all: true },
    });
    const counts = Object.fromEntries(
      JOB_APPLICATION_STATUSES.map((status) => [status, 0]),
    ) as Record<JobApplicationStatus, number>;

    for (const group of groups) {
      counts[toApiJobApplicationStatus(group.status)] = group._count._all;
    }

    return {
      total: Object.values(counts).reduce((sum, count) => sum + count, 0),
      counts,
    };
  }

  private toUpdateData(
    dto: UpdateJobApplicationDto,
  ): Prisma.JobApplicationUpdateInput {
    const data: Prisma.JobApplicationUpdateInput = {};

    for (const field of ['company', 'position'] as const) {
      if (dto[field] !== undefined) {
        data[field] = dto[field];
      }
    }

    for (const field of OPTIONAL_TEXT_FIELDS) {
      if (dto[field] !== undefined) {
        data[field] = dto[field];
      }
    }

    if (dto.status !== undefined) {
      data.status = STATUS_TO_PRISMA[dto.status];
    }

    for (const field of DATE_FIELDS) {
      if (dto[field] !== undefined) {
        data[field] = this.parseNullableDate(dto[field]);
      }
    }

    return data;
  }

  private parseNullableDate(value: string | null | undefined): Date | null {
    if (!value) {
      return null;
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      throw new BadRequestException('Date fields must contain valid dates');
    }

    return date;
  }

  private async findRecord(id: string): Promise<JobApplicationRecord> {
    const application = await this.prisma.jobApplication.findUnique({
      where: { id },
      select: jobApplicationSelect,
    });

    if (!application) {
      throw new NotFoundException('Job application not found');
    }

    return application;
  }

  private async ensureExists(id: string): Promise<void> {
    const application = await this.prisma.jobApplication.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!application) {
      throw new NotFoundException('Job application not found');
    }
  }
}
