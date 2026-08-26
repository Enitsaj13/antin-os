import { NON_WHITESPACE_PATTERN } from '@antin-os/shared';
import type { CreateEducationInput } from '@antin-os/shared';
import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsString,
  Matches,
  Min,
  ValidateIf,
} from 'class-validator';

export function trimString({ value }: { value: unknown }) {
  return typeof value === 'string' ? value.trim() : value;
}

export class CreateEducationDto implements CreateEducationInput {
  @Transform(trimString)
  @IsString()
  @IsNotEmpty()
  institution!: string;

  @Transform(trimString)
  @IsString()
  @IsNotEmpty()
  credential!: string;

  @Transform(trimString)
  @IsString()
  @IsNotEmpty()
  fieldOfStudy!: string;

  @Transform(trimString)
  @IsString()
  @IsNotEmpty()
  location!: string;

  @ValidateIf((_, value) => value !== undefined && value !== null)
  @Transform(trimString)
  @IsDateString()
  startDate?: string | null;

  @ValidateIf((_, value) => value !== undefined && value !== null)
  @Transform(trimString)
  @IsDateString()
  endDate?: string | null;

  @Transform(trimString)
  @IsString()
  @Matches(NON_WHITESPACE_PATTERN)
  summary!: string;

  @IsInt()
  @Min(0)
  displayOrder!: number;

  @ValidateIf((_, value) => value !== undefined)
  @IsBoolean()
  isPublic?: boolean;
}
