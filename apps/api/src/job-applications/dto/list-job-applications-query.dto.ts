import {
  JOB_APPLICATION_STATUSES,
  JOB_APPLICATION_TEXT_LIMITS,
} from '@antin-os/shared';
import type {
  JobApplicationListFilter,
  JobApplicationStatus,
} from '@antin-os/shared';
import { Transform } from 'class-transformer';
import { IsIn, IsString, MaxLength, ValidateIf } from 'class-validator';
import { toOptionalTrimmedText } from './job-application.transforms';

export class ListJobApplicationsQueryDto implements JobApplicationListFilter {
  @ValidateIf((_, value) => value !== undefined)
  @IsIn(JOB_APPLICATION_STATUSES)
  status?: JobApplicationStatus;

  @Transform(toOptionalTrimmedText)
  @ValidateIf((_, value) => value !== undefined)
  @IsString()
  @MaxLength(JOB_APPLICATION_TEXT_LIMITS.search)
  search?: string;
}
