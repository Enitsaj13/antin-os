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
import { OwnerAuthGuard } from '@src/auth/owner-auth.guard';
import { CredentialsService } from './credentials.service';
import type {
  CertificationResponse,
  EducationResponse,
  PortfolioSettingsResponse,
} from './credentials-response';
import { CreateCertificationDto } from './dto/create-certification.dto';
import { CreateEducationDto } from './dto/create-education.dto';
import { ReorderCredentialsDto } from './dto/reorder-credentials.dto';
import { UpdateCertificationDto } from './dto/update-certification.dto';
import { UpdateEducationDto } from './dto/update-education.dto';
import { UpdatePortfolioSettingsDto } from './dto/update-portfolio-settings.dto';

type CredentialsOperations = {
  getSettings(): Promise<PortfolioSettingsResponse>;
  updateSettings(
    dto: UpdatePortfolioSettingsDto,
  ): Promise<PortfolioSettingsResponse>;
  createEducation(dto: CreateEducationDto): Promise<EducationResponse>;
  findAllEducationManaged(): Promise<EducationResponse[]>;
  findEducationManaged(id: string): Promise<EducationResponse>;
  updateEducation(
    id: string,
    dto: UpdateEducationDto,
  ): Promise<EducationResponse>;
  removeEducation(id: string): Promise<EducationResponse>;
  reorderEducation(dto: ReorderCredentialsDto): Promise<EducationResponse[]>;
  findAllEducationPublic(): Promise<EducationResponse[]>;
  createCertification(
    dto: CreateCertificationDto,
  ): Promise<CertificationResponse>;
  findAllCertificationManaged(): Promise<CertificationResponse[]>;
  findCertificationManaged(id: string): Promise<CertificationResponse>;
  updateCertification(
    id: string,
    dto: UpdateCertificationDto,
  ): Promise<CertificationResponse>;
  removeCertification(id: string): Promise<CertificationResponse>;
  reorderCertification(
    dto: ReorderCredentialsDto,
  ): Promise<CertificationResponse[]>;
  findAllCertificationPublic(): Promise<CertificationResponse[]>;
};

@Controller()
export class CredentialsController {
  constructor(
    @Inject(CredentialsService)
    private readonly credentialsService: CredentialsOperations,
  ) {}

  @Get('portfolio-settings')
  @UseGuards(OwnerAuthGuard)
  getSettings(): Promise<PortfolioSettingsResponse> {
    return this.credentialsService.getSettings();
  }

  @Patch('portfolio-settings')
  @UseGuards(OwnerAuthGuard)
  updateSettings(
    @Body() dto: UpdatePortfolioSettingsDto,
  ): Promise<PortfolioSettingsResponse> {
    return this.credentialsService.updateSettings(dto);
  }

  @Post('education')
  @UseGuards(OwnerAuthGuard)
  createEducation(@Body() dto: CreateEducationDto): Promise<EducationResponse> {
    return this.credentialsService.createEducation(dto);
  }

  @Get('education')
  @UseGuards(OwnerAuthGuard)
  findAllEducationManaged(): Promise<EducationResponse[]> {
    return this.credentialsService.findAllEducationManaged();
  }

  @Patch('education/reorder')
  @UseGuards(OwnerAuthGuard)
  reorderEducation(
    @Body() dto: ReorderCredentialsDto,
  ): Promise<EducationResponse[]> {
    return this.credentialsService.reorderEducation(dto);
  }

  @Get('education/:id')
  @UseGuards(OwnerAuthGuard)
  findEducationManaged(@Param('id') id: string): Promise<EducationResponse> {
    return this.credentialsService.findEducationManaged(id);
  }

  @Patch('education/:id')
  @UseGuards(OwnerAuthGuard)
  updateEducation(
    @Param('id') id: string,
    @Body() dto: UpdateEducationDto,
  ): Promise<EducationResponse> {
    return this.credentialsService.updateEducation(id, dto);
  }

  @Delete('education/:id')
  @UseGuards(OwnerAuthGuard)
  removeEducation(@Param('id') id: string): Promise<EducationResponse> {
    return this.credentialsService.removeEducation(id);
  }

  @Get('public/education')
  findAllEducationPublic(): Promise<EducationResponse[]> {
    return this.credentialsService.findAllEducationPublic();
  }

  @Post('certifications')
  @UseGuards(OwnerAuthGuard)
  createCertification(
    @Body() dto: CreateCertificationDto,
  ): Promise<CertificationResponse> {
    return this.credentialsService.createCertification(dto);
  }

  @Get('certifications')
  @UseGuards(OwnerAuthGuard)
  findAllCertificationManaged(): Promise<CertificationResponse[]> {
    return this.credentialsService.findAllCertificationManaged();
  }

  @Patch('certifications/reorder')
  @UseGuards(OwnerAuthGuard)
  reorderCertification(
    @Body() dto: ReorderCredentialsDto,
  ): Promise<CertificationResponse[]> {
    return this.credentialsService.reorderCertification(dto);
  }

  @Get('certifications/:id')
  @UseGuards(OwnerAuthGuard)
  findCertificationManaged(
    @Param('id') id: string,
  ): Promise<CertificationResponse> {
    return this.credentialsService.findCertificationManaged(id);
  }

  @Patch('certifications/:id')
  @UseGuards(OwnerAuthGuard)
  updateCertification(
    @Param('id') id: string,
    @Body() dto: UpdateCertificationDto,
  ): Promise<CertificationResponse> {
    return this.credentialsService.updateCertification(id, dto);
  }

  @Delete('certifications/:id')
  @UseGuards(OwnerAuthGuard)
  removeCertification(@Param('id') id: string): Promise<CertificationResponse> {
    return this.credentialsService.removeCertification(id);
  }

  @Get('public/certifications')
  findAllCertificationPublic(): Promise<CertificationResponse[]> {
    return this.credentialsService.findAllCertificationPublic();
  }
}
