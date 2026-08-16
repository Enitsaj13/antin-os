import {
  NON_WHITESPACE_PATTERN,
  PROJECT_IMAGE_KEY_PATTERN,
  PROJECT_SLUG_PATTERN,
} from '@antin-os/shared';
import type { UpdateProjectInput } from '@antin-os/shared';
import {
  ArrayNotEmpty,
  IsArray,
  IsBoolean,
  IsString,
  IsUrl,
  Matches,
  ValidateIf,
} from 'class-validator';
import { Transform } from 'class-transformer';

function trimString({ value }: { value: unknown }) {
  return typeof value === 'string' ? value.trim() : value;
}

function trimStringArray({ value }: { value: unknown }) {
  if (!Array.isArray(value)) {
    return value;
  }

  return (value as unknown[]).map((item: unknown) =>
    typeof item === 'string' ? item.trim() : item,
  );
}

export class UpdateProjectDto implements UpdateProjectInput {
  @ValidateIf((_, value) => value !== undefined)
  @Transform(trimString)
  @IsString()
  @Matches(NON_WHITESPACE_PATTERN)
  title?: string;

  @ValidateIf((_, value) => value !== undefined)
  @Transform(trimString)
  @IsString()
  @Matches(PROJECT_SLUG_PATTERN)
  slug?: string;

  @ValidateIf((_, value) => value !== undefined)
  @Transform(trimString)
  @IsString()
  @Matches(NON_WHITESPACE_PATTERN)
  summary?: string;

  @ValidateIf((_, value) => value !== undefined && value !== null)
  @Transform(trimString)
  @IsString()
  description?: string | null;

  @ValidateIf((_, value) => value !== undefined)
  @Transform(trimStringArray)
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  @Matches(NON_WHITESPACE_PATTERN, { each: true })
  techStack?: string[];

  @ValidateIf((_, value) => value !== undefined && value !== null)
  @Transform(trimString)
  @IsUrl()
  repoUrl?: string | null;

  @ValidateIf((_, value) => value !== undefined && value !== null)
  @Transform(trimString)
  @IsUrl()
  liveUrl?: string | null;

  @ValidateIf((_, value) => value !== undefined && value !== null)
  @Transform(trimString)
  @IsUrl()
  imageUrl?: string | null;

  @ValidateIf((_, value) => value !== undefined && value !== null)
  @Transform(trimString)
  @IsString()
  @Matches(PROJECT_IMAGE_KEY_PATTERN)
  imageKey?: string | null;

  @ValidateIf((_, value) => value !== undefined)
  @IsBoolean()
  isPublic?: boolean;
}
