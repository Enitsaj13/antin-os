import { NON_WHITESPACE_PATTERN } from '@antin-os/shared';
import type { UpdateExperienceInput } from '@antin-os/shared';
import { trimString, trimStringArray } from './create-experience.dto';
import { Transform } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsInt,
  IsString,
  Matches,
  Min,
  ValidateIf,
} from 'class-validator';

export class UpdateExperienceDto implements UpdateExperienceInput {
  @ValidateIf((_, value) => value !== undefined)
  @Transform(trimString)
  @IsString()
  @Matches(NON_WHITESPACE_PATTERN)
  company?: string;

  @ValidateIf((_, value) => value !== undefined)
  @Transform(trimString)
  @IsString()
  @Matches(NON_WHITESPACE_PATTERN)
  role?: string;

  @ValidateIf((_, value) => value !== undefined)
  @Transform(trimString)
  @IsString()
  @Matches(NON_WHITESPACE_PATTERN)
  location?: string;

  @ValidateIf((_, value) => value !== undefined)
  @Transform(trimString)
  @IsString()
  @Matches(NON_WHITESPACE_PATTERN)
  employmentType?: string;

  @ValidateIf((_, value) => value !== undefined)
  @Transform(trimString)
  @IsDateString()
  startDate?: string;

  @ValidateIf((_, value) => value !== undefined && value !== null)
  @Transform(trimString)
  @IsDateString()
  endDate?: string | null;

  @ValidateIf((_, value) => value !== undefined)
  @IsBoolean()
  isCurrent?: boolean;

  @ValidateIf((_, value) => value !== undefined)
  @Transform(trimString)
  @IsString()
  @Matches(NON_WHITESPACE_PATTERN)
  summary?: string;

  @ValidateIf((_, value) => value !== undefined)
  @Transform(trimStringArray)
  @IsArray()
  @IsString({ each: true })
  @Matches(NON_WHITESPACE_PATTERN, { each: true })
  achievements?: string[];

  @ValidateIf((_, value) => value !== undefined)
  @Transform(trimStringArray)
  @IsArray()
  @IsString({ each: true })
  @Matches(NON_WHITESPACE_PATTERN, { each: true })
  technologies?: string[];

  @ValidateIf((_, value) => value !== undefined)
  @IsInt()
  @Min(0)
  displayOrder?: number;

  @ValidateIf((_, value) => value !== undefined)
  @IsBoolean()
  isPublic?: boolean;
}
