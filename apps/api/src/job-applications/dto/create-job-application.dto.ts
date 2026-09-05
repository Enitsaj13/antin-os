import {
  JOB_APPLICATION_STATUSES,
  JOB_APPLICATION_TEXT_LIMITS,
} from '@antin-os/shared';
import type {
  CreateJobApplicationInput,
  JobApplicationStatus,
} from '@antin-os/shared';
import { Transform } from 'class-transformer';
import {
  IsDateString,
  IsIn,
  IsNotEmpty,
  IsString,
  IsUrl,
  MaxLength,
  ValidateIf,
} from 'class-validator';
import {
  toNullableTrimmedText,
  trimRequiredText,
} from './job-application.transforms';

export class CreateJobApplicationDto implements CreateJobApplicationInput {
  @Transform(trimRequiredText)
  @IsString()
  @IsNotEmpty()
  @MaxLength(JOB_APPLICATION_TEXT_LIMITS.company)
  company!: string;

  @Transform(trimRequiredText)
  @IsString()
  @IsNotEmpty()
  @MaxLength(JOB_APPLICATION_TEXT_LIMITS.position)
  position!: string;

  @Transform(toNullableTrimmedText)
  @ValidateIf((_, value) => value !== undefined && value !== null)
  @IsString()
  @MaxLength(JOB_APPLICATION_TEXT_LIMITS.jobUrl)
  @IsUrl({
    protocols: ['http', 'https'],
    require_protocol: true,
    require_valid_protocol: true,
  })
  jobUrl?: string | null;

  @Transform(toNullableTrimmedText)
  @ValidateIf((_, value) => value !== undefined && value !== null)
  @IsString()
  @MaxLength(JOB_APPLICATION_TEXT_LIMITS.source)
  source?: string | null;

  @Transform(toNullableTrimmedText)
  @ValidateIf((_, value) => value !== undefined && value !== null)
  @IsString()
  @MaxLength(JOB_APPLICATION_TEXT_LIMITS.salaryRange)
  salaryRange?: string | null;

  @Transform(toNullableTrimmedText)
  @ValidateIf((_, value) => value !== undefined && value !== null)
  @IsString()
  @MaxLength(JOB_APPLICATION_TEXT_LIMITS.jobDescription)
  jobDescription?: string | null;

  @Transform(toNullableTrimmedText)
  @ValidateIf((_, value) => value !== undefined && value !== null)
  @IsString()
  @MaxLength(JOB_APPLICATION_TEXT_LIMITS.notes)
  notes?: string | null;

  @ValidateIf((_, value) => value !== undefined)
  @IsIn(JOB_APPLICATION_STATUSES)
  status?: JobApplicationStatus;

  @Transform(toNullableTrimmedText)
  @ValidateIf((_, value) => value !== undefined && value !== null)
  @IsDateString({ strict: true })
  applicationDate?: string | null;

  @Transform(toNullableTrimmedText)
  @ValidateIf((_, value) => value !== undefined && value !== null)
  @IsDateString({ strict: true })
  interviewDate?: string | null;

  @Transform(toNullableTrimmedText)
  @ValidateIf((_, value) => value !== undefined && value !== null)
  @IsDateString({ strict: true })
  nextActionDate?: string | null;

  @Transform(toNullableTrimmedText)
  @ValidateIf((_, value) => value !== undefined && value !== null)
  @IsString()
  @MaxLength(JOB_APPLICATION_TEXT_LIMITS.followUpNotes)
  followUpNotes?: string | null;
}
