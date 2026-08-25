import { NON_WHITESPACE_PATTERN } from '@antin-os/shared';
import type { CreateExperienceInput } from '@antin-os/shared';
import { Transform } from 'class-transformer';
import {
  IsArray,
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

export function trimStringArray({ value }: { value: unknown }) {
  if (!Array.isArray(value)) {
    return value;
  }

  return (value as unknown[]).map((item: unknown) =>
    typeof item === 'string' ? item.trim() : item,
  );
}

export class CreateExperienceDto implements CreateExperienceInput {
  @Transform(trimString)
  @IsString()
  @IsNotEmpty()
  company!: string;

  @Transform(trimString)
  @IsString()
  @IsNotEmpty()
  role!: string;

  @Transform(trimString)
  @IsString()
  @IsNotEmpty()
  location!: string;

  @Transform(trimString)
  @IsString()
  @IsNotEmpty()
  employmentType!: string;

  @Transform(trimString)
  @IsDateString()
  startDate!: string;

  @ValidateIf((_, value) => value !== undefined && value !== null)
  @Transform(trimString)
  @IsDateString()
  endDate?: string | null;

  @ValidateIf((_, value) => value !== undefined)
  @IsBoolean()
  isCurrent?: boolean;

  @Transform(trimString)
  @IsString()
  @IsNotEmpty()
  summary!: string;

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

  @IsInt()
  @Min(0)
  displayOrder!: number;

  @ValidateIf((_, value) => value !== undefined)
  @IsBoolean()
  isPublic?: boolean;
}
