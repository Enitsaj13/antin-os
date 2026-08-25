import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '@prisma/prisma.service';
import { CreateExperienceDto } from './dto/create-experience.dto';
import { ReorderExperienceDto } from './dto/reorder-experience.dto';
import { UpdateExperienceDto } from './dto/update-experience.dto';
import {
  ExperienceRecord,
  ExperienceResponse,
  experienceSelect,
  toExperienceResponse,
} from './experience-response';

type ExperienceCreateData = Pick<
  Prisma.ExperienceCreateInput,
  | 'company'
  | 'role'
  | 'location'
  | 'employmentType'
  | 'startDate'
  | 'endDate'
  | 'isCurrent'
  | 'summary'
  | 'achievements'
  | 'technologies'
  | 'displayOrder'
  | 'isPublic'
>;

type ExperienceUpdateData = Partial<ExperienceCreateData>;

const EXPERIENCE_ORDER = [
  { displayOrder: 'asc' },
  { startDate: 'desc' },
  { updatedAt: 'desc' },
] satisfies Prisma.ExperienceOrderByWithRelationInput[];

@Injectable()
export class ExperienceService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateExperienceDto): Promise<ExperienceResponse> {
    const startDate = this.parseDate(dto.startDate, 'startDate');
    const endDate = dto.endDate ? this.parseDate(dto.endDate, 'endDate') : null;
    const isCurrent = dto.isCurrent ?? false;

    this.assertDateRules(startDate, endDate, isCurrent);

    const experience = await this.prisma.experience.create({
      data: {
        company: dto.company,
        role: dto.role,
        location: dto.location,
        employmentType: dto.employmentType,
        startDate,
        endDate,
        isCurrent,
        summary: dto.summary,
        achievements: dto.achievements ?? [],
        technologies: dto.technologies ?? [],
        displayOrder: dto.displayOrder,
        isPublic: dto.isPublic ?? false,
      } satisfies ExperienceCreateData,
      select: experienceSelect,
    });

    return toExperienceResponse(experience);
  }

  async findAllManaged(): Promise<ExperienceResponse[]> {
    const experiences = await this.prisma.experience.findMany({
      orderBy: EXPERIENCE_ORDER,
      select: experienceSelect,
    });

    return experiences.map(toExperienceResponse);
  }

  async findManaged(id: string): Promise<ExperienceResponse> {
    const experience = await this.prisma.experience.findUnique({
      where: { id },
      select: experienceSelect,
    });

    return toExperienceResponse(this.requireExperience(experience));
  }

  async update(
    id: string,
    dto: UpdateExperienceDto,
  ): Promise<ExperienceResponse> {
    const data = this.toUpdateData(dto);

    if (Object.keys(data).length === 0) {
      throw new BadRequestException(
        'Update request must include at least one field',
      );
    }

    const existing = await this.findRecord(id);
    const nextStartDate =
      dto.startDate !== undefined
        ? (data.startDate as Date)
        : existing.startDate;
    const nextEndDate =
      dto.endDate !== undefined
        ? (data.endDate as Date | null)
        : existing.endDate;
    const nextIsCurrent =
      dto.isCurrent !== undefined ? dto.isCurrent : existing.isCurrent;

    this.assertDateRules(nextStartDate, nextEndDate, nextIsCurrent);

    const experience = await this.prisma.experience.update({
      where: { id },
      data,
      select: experienceSelect,
    });

    return toExperienceResponse(experience);
  }

  async remove(id: string): Promise<ExperienceResponse> {
    await this.ensureExists(id);

    const experience = await this.prisma.experience.delete({
      where: { id },
      select: experienceSelect,
    });

    return toExperienceResponse(experience);
  }

  async reorder(dto: ReorderExperienceDto): Promise<ExperienceResponse[]> {
    const ids = dto.items.map((item) => item.id);
    const uniqueIds = new Set(ids);

    if (uniqueIds.size !== ids.length) {
      throw new BadRequestException('Experience ids must be unique');
    }

    const existing = await this.prisma.experience.findMany({
      where: { id: { in: ids } },
      select: { id: true },
    });

    if (existing.length !== ids.length) {
      throw new BadRequestException('Experience reorder includes unknown ids');
    }

    await this.prisma.$transaction(
      dto.items.map((item) =>
        this.prisma.experience.update({
          where: { id: item.id },
          data: { displayOrder: item.displayOrder },
          select: { id: true },
        }),
      ),
    );

    return this.findAllManaged();
  }

  async findAllPublic(): Promise<ExperienceResponse[]> {
    const experiences = await this.prisma.experience.findMany({
      where: { isPublic: true },
      orderBy: EXPERIENCE_ORDER,
      select: experienceSelect,
    });

    return experiences.map(toExperienceResponse);
  }

  private toUpdateData(dto: UpdateExperienceDto): ExperienceUpdateData {
    const data: ExperienceUpdateData = {};

    for (const key of [
      'company',
      'role',
      'location',
      'employmentType',
      'isCurrent',
      'summary',
      'achievements',
      'technologies',
      'displayOrder',
      'isPublic',
    ] as const) {
      const value = dto[key];

      if (value !== undefined) {
        data[key] = value as never;
      }
    }

    if (dto.startDate !== undefined) {
      data.startDate = this.parseDate(dto.startDate, 'startDate');
    }

    if (dto.endDate !== undefined) {
      data.endDate = dto.endDate
        ? this.parseDate(dto.endDate, 'endDate')
        : null;
    }

    return data;
  }

  private async findRecord(id: string): Promise<ExperienceRecord> {
    const experience = await this.prisma.experience.findUnique({
      where: { id },
      select: experienceSelect,
    });

    return this.requireExperience(experience);
  }

  private async ensureExists(id: string): Promise<void> {
    const existing = await this.prisma.experience.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!existing) {
      throw new NotFoundException('Experience not found');
    }
  }

  private requireExperience(
    experience: ExperienceRecord | null,
  ): ExperienceRecord {
    if (!experience) {
      throw new NotFoundException('Experience not found');
    }

    return experience;
  }

  private parseDate(value: string, fieldName: string): Date {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      throw new BadRequestException(`${fieldName} must be a valid date`);
    }

    return date;
  }

  private assertDateRules(
    startDate: Date,
    endDate: Date | null,
    isCurrent: boolean,
  ): void {
    if (isCurrent && endDate) {
      throw new BadRequestException(
        'Current experience cannot have an end date',
      );
    }

    if (endDate && endDate.getTime() < startDate.getTime()) {
      throw new BadRequestException('End date cannot be before start date');
    }
  }
}
