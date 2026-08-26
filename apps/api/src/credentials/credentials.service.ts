import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PORTFOLIO_SETTINGS_SINGLETON_KEY } from '@antin-os/shared';
import { Prisma } from '@prisma/client';
import { PrismaService } from '@prisma/prisma.service';
import { CreateCertificationDto } from './dto/create-certification.dto';
import { CreateEducationDto } from './dto/create-education.dto';
import { ReorderCredentialsDto } from './dto/reorder-credentials.dto';
import { UpdateCertificationDto } from './dto/update-certification.dto';
import { UpdateEducationDto } from './dto/update-education.dto';
import { UpdatePortfolioSettingsDto } from './dto/update-portfolio-settings.dto';
import {
  CertificationRecord,
  CertificationResponse,
  EducationRecord,
  EducationResponse,
  PortfolioSettingsResponse,
  certificationSelect,
  educationSelect,
  portfolioSettingsSelect,
  toCertificationResponse,
  toEducationResponse,
  toPortfolioSettingsResponse,
} from './credentials-response';

type EducationCreateData = Pick<
  Prisma.EducationCreateInput,
  | 'institution'
  | 'credential'
  | 'fieldOfStudy'
  | 'location'
  | 'startDate'
  | 'endDate'
  | 'summary'
  | 'displayOrder'
  | 'isPublic'
>;

type EducationUpdateData = Partial<EducationCreateData>;

type CertificationCreateData = Pick<
  Prisma.CertificationCreateInput,
  | 'name'
  | 'issuer'
  | 'issueDate'
  | 'expirationDate'
  | 'credentialId'
  | 'credentialUrl'
  | 'summary'
  | 'displayOrder'
  | 'isPublic'
>;

type CertificationUpdateData = Partial<CertificationCreateData>;

const EDUCATION_ORDER = [
  { displayOrder: 'asc' },
  { startDate: 'desc' },
  { updatedAt: 'desc' },
] satisfies Prisma.EducationOrderByWithRelationInput[];

const CERTIFICATION_ORDER = [
  { displayOrder: 'asc' },
  { issueDate: 'desc' },
  { updatedAt: 'desc' },
] satisfies Prisma.CertificationOrderByWithRelationInput[];

@Injectable()
export class CredentialsService {
  constructor(private readonly prisma: PrismaService) {}

  async getSettings(): Promise<PortfolioSettingsResponse> {
    const settings = await this.prisma.portfolioSettings.upsert({
      where: { singletonKey: PORTFOLIO_SETTINGS_SINGLETON_KEY },
      create: { singletonKey: PORTFOLIO_SETTINGS_SINGLETON_KEY },
      update: {},
      select: portfolioSettingsSelect,
    });

    return toPortfolioSettingsResponse(settings);
  }

  async updateSettings(
    dto: UpdatePortfolioSettingsDto,
  ): Promise<PortfolioSettingsResponse> {
    const data: Prisma.PortfolioSettingsUpdateInput = {};

    if (dto.showEducation !== undefined) {
      data.showEducation = dto.showEducation;
    }

    if (dto.showCertifications !== undefined) {
      data.showCertifications = dto.showCertifications;
    }

    if (Object.keys(data).length === 0) {
      throw new BadRequestException(
        'Settings update must include at least one field',
      );
    }

    const settings = await this.prisma.portfolioSettings.upsert({
      where: { singletonKey: PORTFOLIO_SETTINGS_SINGLETON_KEY },
      create: {
        singletonKey: PORTFOLIO_SETTINGS_SINGLETON_KEY,
        showEducation: dto.showEducation ?? false,
        showCertifications: dto.showCertifications ?? false,
      },
      update: data,
      select: portfolioSettingsSelect,
    });

    return toPortfolioSettingsResponse(settings);
  }

  async createEducation(dto: CreateEducationDto): Promise<EducationResponse> {
    const startDate = dto.startDate
      ? this.parseDate(dto.startDate, 'startDate')
      : null;
    const endDate = dto.endDate ? this.parseDate(dto.endDate, 'endDate') : null;

    this.assertOptionalDateRange(startDate, endDate, 'End date');

    const education = await this.prisma.education.create({
      data: {
        institution: dto.institution,
        credential: dto.credential,
        fieldOfStudy: dto.fieldOfStudy,
        location: dto.location,
        startDate,
        endDate,
        summary: dto.summary,
        displayOrder: dto.displayOrder,
        isPublic: dto.isPublic ?? false,
      } satisfies EducationCreateData,
      select: educationSelect,
    });

    return toEducationResponse(education);
  }

  async findAllEducationManaged(): Promise<EducationResponse[]> {
    const records = await this.prisma.education.findMany({
      orderBy: EDUCATION_ORDER,
      select: educationSelect,
    });

    return records.map(toEducationResponse);
  }

  async findEducationManaged(id: string): Promise<EducationResponse> {
    return toEducationResponse(await this.findEducationRecord(id));
  }

  async updateEducation(
    id: string,
    dto: UpdateEducationDto,
  ): Promise<EducationResponse> {
    const data = this.toEducationUpdateData(dto);

    if (Object.keys(data).length === 0) {
      throw new BadRequestException(
        'Education update must include at least one field',
      );
    }

    const existing = await this.findEducationRecord(id);
    const nextStartDate =
      dto.startDate !== undefined
        ? (data.startDate as Date | null)
        : existing.startDate;
    const nextEndDate =
      dto.endDate !== undefined
        ? (data.endDate as Date | null)
        : existing.endDate;

    this.assertOptionalDateRange(nextStartDate, nextEndDate, 'End date');

    const education = await this.prisma.education.update({
      where: { id },
      data,
      select: educationSelect,
    });

    return toEducationResponse(education);
  }

  async removeEducation(id: string): Promise<EducationResponse> {
    await this.findEducationRecord(id);

    const education = await this.prisma.education.delete({
      where: { id },
      select: educationSelect,
    });

    return toEducationResponse(education);
  }

  async reorderEducation(
    dto: ReorderCredentialsDto,
  ): Promise<EducationResponse[]> {
    await this.assertReorderIds(
      dto.items,
      (ids) =>
        this.prisma.education.findMany({
          where: { id: { in: ids } },
          select: { id: true },
        }),
      'Education reorder includes unknown ids',
    );

    await this.prisma.$transaction(
      dto.items.map((item) =>
        this.prisma.education.update({
          where: { id: item.id },
          data: { displayOrder: item.displayOrder },
          select: { id: true },
        }),
      ),
    );

    return this.findAllEducationManaged();
  }

  async findAllEducationPublic(): Promise<EducationResponse[]> {
    const settings = await this.getSettings();

    if (!settings.showEducation) {
      return [];
    }

    const records = await this.prisma.education.findMany({
      where: { isPublic: true },
      orderBy: EDUCATION_ORDER,
      select: educationSelect,
    });

    return records.map(toEducationResponse);
  }

  async createCertification(
    dto: CreateCertificationDto,
  ): Promise<CertificationResponse> {
    const issueDate = dto.issueDate
      ? this.parseDate(dto.issueDate, 'issueDate')
      : null;
    const expirationDate = dto.expirationDate
      ? this.parseDate(dto.expirationDate, 'expirationDate')
      : null;

    this.assertOptionalDateRange(issueDate, expirationDate, 'Expiration date');

    const certification = await this.prisma.certification.create({
      data: {
        name: dto.name,
        issuer: dto.issuer,
        issueDate,
        expirationDate,
        credentialId: dto.credentialId ?? null,
        credentialUrl: dto.credentialUrl ?? null,
        summary: dto.summary,
        displayOrder: dto.displayOrder,
        isPublic: dto.isPublic ?? false,
      } satisfies CertificationCreateData,
      select: certificationSelect,
    });

    return toCertificationResponse(certification);
  }

  async findAllCertificationManaged(): Promise<CertificationResponse[]> {
    const records = await this.prisma.certification.findMany({
      orderBy: CERTIFICATION_ORDER,
      select: certificationSelect,
    });

    return records.map(toCertificationResponse);
  }

  async findCertificationManaged(id: string): Promise<CertificationResponse> {
    return toCertificationResponse(await this.findCertificationRecord(id));
  }

  async updateCertification(
    id: string,
    dto: UpdateCertificationDto,
  ): Promise<CertificationResponse> {
    const data = this.toCertificationUpdateData(dto);

    if (Object.keys(data).length === 0) {
      throw new BadRequestException(
        'Certification update must include at least one field',
      );
    }

    const existing = await this.findCertificationRecord(id);
    const nextIssueDate =
      dto.issueDate !== undefined
        ? (data.issueDate as Date | null)
        : existing.issueDate;
    const nextExpirationDate =
      dto.expirationDate !== undefined
        ? (data.expirationDate as Date | null)
        : existing.expirationDate;

    this.assertOptionalDateRange(
      nextIssueDate,
      nextExpirationDate,
      'Expiration date',
    );

    const certification = await this.prisma.certification.update({
      where: { id },
      data,
      select: certificationSelect,
    });

    return toCertificationResponse(certification);
  }

  async removeCertification(id: string): Promise<CertificationResponse> {
    await this.findCertificationRecord(id);

    const certification = await this.prisma.certification.delete({
      where: { id },
      select: certificationSelect,
    });

    return toCertificationResponse(certification);
  }

  async reorderCertification(
    dto: ReorderCredentialsDto,
  ): Promise<CertificationResponse[]> {
    await this.assertReorderIds(
      dto.items,
      (ids) =>
        this.prisma.certification.findMany({
          where: { id: { in: ids } },
          select: { id: true },
        }),
      'Certification reorder includes unknown ids',
    );

    await this.prisma.$transaction(
      dto.items.map((item) =>
        this.prisma.certification.update({
          where: { id: item.id },
          data: { displayOrder: item.displayOrder },
          select: { id: true },
        }),
      ),
    );

    return this.findAllCertificationManaged();
  }

  async findAllCertificationPublic(): Promise<CertificationResponse[]> {
    const settings = await this.getSettings();

    if (!settings.showCertifications) {
      return [];
    }

    const records = await this.prisma.certification.findMany({
      where: { isPublic: true },
      orderBy: CERTIFICATION_ORDER,
      select: certificationSelect,
    });

    return records.map(toCertificationResponse);
  }

  private toEducationUpdateData(dto: UpdateEducationDto): EducationUpdateData {
    const data: EducationUpdateData = {};

    for (const key of [
      'institution',
      'credential',
      'fieldOfStudy',
      'location',
      'summary',
      'displayOrder',
      'isPublic',
    ] as const) {
      const value = dto[key];

      if (value !== undefined) {
        data[key] = value as never;
      }
    }

    if (dto.startDate !== undefined) {
      data.startDate = dto.startDate
        ? this.parseDate(dto.startDate, 'startDate')
        : null;
    }

    if (dto.endDate !== undefined) {
      data.endDate = dto.endDate
        ? this.parseDate(dto.endDate, 'endDate')
        : null;
    }

    return data;
  }

  private toCertificationUpdateData(
    dto: UpdateCertificationDto,
  ): CertificationUpdateData {
    const data: CertificationUpdateData = {};

    for (const key of [
      'name',
      'issuer',
      'credentialId',
      'credentialUrl',
      'summary',
      'displayOrder',
      'isPublic',
    ] as const) {
      const value = dto[key];

      if (value !== undefined) {
        data[key] = value as never;
      }
    }

    if (dto.issueDate !== undefined) {
      data.issueDate = dto.issueDate
        ? this.parseDate(dto.issueDate, 'issueDate')
        : null;
    }

    if (dto.expirationDate !== undefined) {
      data.expirationDate = dto.expirationDate
        ? this.parseDate(dto.expirationDate, 'expirationDate')
        : null;
    }

    return data;
  }

  private async findEducationRecord(id: string): Promise<EducationRecord> {
    const education = await this.prisma.education.findUnique({
      where: { id },
      select: educationSelect,
    });

    if (!education) {
      throw new NotFoundException('Education not found');
    }

    return education;
  }

  private async findCertificationRecord(
    id: string,
  ): Promise<CertificationRecord> {
    const certification = await this.prisma.certification.findUnique({
      where: { id },
      select: certificationSelect,
    });

    if (!certification) {
      throw new NotFoundException('Certification not found');
    }

    return certification;
  }

  private parseDate(value: string, fieldName: string): Date {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      throw new BadRequestException(`${fieldName} must be a valid date`);
    }

    return date;
  }

  private assertOptionalDateRange(
    startDate: Date | null,
    endDate: Date | null,
    endLabel: string,
  ): void {
    if (startDate && endDate && endDate.getTime() < startDate.getTime()) {
      throw new BadRequestException(`${endLabel} cannot be before start date`);
    }
  }

  private async assertReorderIds(
    items: ReorderCredentialsDto['items'],
    findExisting: (ids: string[]) => Promise<Array<{ id: string }>>,
    unknownMessage: string,
  ): Promise<void> {
    const ids = items.map((item) => item.id);
    const uniqueIds = new Set(ids);

    if (uniqueIds.size !== ids.length) {
      throw new BadRequestException('Credential ids must be unique');
    }

    const existing = await findExisting(ids);

    if (existing.length !== ids.length) {
      throw new BadRequestException(unknownMessage);
    }
  }
}
