import { NON_WHITESPACE_PATTERN } from '@antin-os/shared';
import type { UpdateEducationInput } from '@antin-os/shared';
import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsDateString,
  IsInt,
  IsString,
  Matches,
  Min,
  ValidateIf,
} from 'class-validator';
import { trimString } from './create-education.dto';

export class UpdateEducationDto implements UpdateEducationInput {
  @ValidateIf((_, value) => value !== undefined)
  @Transform(trimString)
  @IsString()
  @Matches(NON_WHITESPACE_PATTERN)
  institution?: string;

  @ValidateIf((_, value) => value !== undefined)
  @Transform(trimString)
  @IsString()
  @Matches(NON_WHITESPACE_PATTERN)
  credential?: string;

  @ValidateIf((_, value) => value !== undefined)
  @Transform(trimString)
  @IsString()
  @Matches(NON_WHITESPACE_PATTERN)
  fieldOfStudy?: string;

  @ValidateIf((_, value) => value !== undefined)
  @Transform(trimString)
  @IsString()
  @Matches(NON_WHITESPACE_PATTERN)
  location?: string;

  @ValidateIf((_, value) => value !== undefined && value !== null)
  @Transform(trimString)
  @IsDateString()
  startDate?: string | null;

  @ValidateIf((_, value) => value !== undefined && value !== null)
  @Transform(trimString)
  @IsDateString()
  endDate?: string | null;

  @ValidateIf((_, value) => value !== undefined)
  @Transform(trimString)
  @IsString()
  @Matches(NON_WHITESPACE_PATTERN)
  summary?: string;

  @ValidateIf((_, value) => value !== undefined)
  @IsInt()
  @Min(0)
  displayOrder?: number;

  @ValidateIf((_, value) => value !== undefined)
  @IsBoolean()
  isPublic?: boolean;
}
