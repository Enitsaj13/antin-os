import { NON_WHITESPACE_PATTERN } from '@antin-os/shared';
import type { UpdateProjectCaseStudyInput } from '@antin-os/shared';
import { Transform } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsString,
  Matches,
  ValidateIf,
} from 'class-validator';

function trimString({ value }: { value: unknown }) {
  return typeof value === 'string' ? value.trim() : value;
}

function trimNullableString({ value }: { value: unknown }) {
  if (value === null || value === undefined) {
    return value;
  }

  return typeof value === 'string' ? value.trim() : value;
}

function trimStringArray({ value }: { value: unknown }) {
  if (!Array.isArray(value)) {
    return value;
  }

  return (value as unknown[]).map((item) =>
    typeof item === 'string' ? item.trim() : item,
  );
}

export class UpdateProjectCaseStudyDto implements UpdateProjectCaseStudyInput {
  @ValidateIf((_, value) => value !== undefined)
  @Transform(trimString)
  @IsString()
  @Matches(NON_WHITESPACE_PATTERN)
  context?: string;

  @ValidateIf((_, value) => value !== undefined)
  @Transform(trimString)
  @IsString()
  @Matches(NON_WHITESPACE_PATTERN)
  problem?: string;

  @ValidateIf((_, value) => value !== undefined)
  @Transform(trimString)
  @IsString()
  @Matches(NON_WHITESPACE_PATTERN)
  role?: string;

  @ValidateIf((_, value) => value !== undefined)
  @Transform(trimString)
  @IsString()
  @Matches(NON_WHITESPACE_PATTERN)
  approach?: string;

  @ValidateIf((_, value) => value !== undefined)
  @Transform(trimStringArray)
  @IsArray()
  @IsString({ each: true })
  @Matches(NON_WHITESPACE_PATTERN, { each: true })
  responsibilities?: string[];

  @ValidateIf((_, value) => value !== undefined)
  @Transform(trimStringArray)
  @IsArray()
  @IsString({ each: true })
  @Matches(NON_WHITESPACE_PATTERN, { each: true })
  technicalChallenges?: string[];

  @ValidateIf((_, value) => value !== undefined)
  @Transform(trimStringArray)
  @IsArray()
  @IsString({ each: true })
  @Matches(NON_WHITESPACE_PATTERN, { each: true })
  outcomes?: string[];

  @ValidateIf((_, value) => value !== undefined && value !== null)
  @Transform(trimNullableString)
  @IsString()
  lessonsLearned?: string | null;

  @ValidateIf((_, value) => value !== undefined)
  @IsBoolean()
  isPublic?: boolean;
}
