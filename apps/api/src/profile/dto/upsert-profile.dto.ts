import { NON_WHITESPACE_PATTERN } from '@antin-os/shared';
import type { UpsertProfileInput } from '@antin-os/shared';
import { Transform } from 'class-transformer';
import { IsEmail, IsString, IsUrl, Matches, ValidateIf } from 'class-validator';

function trimString({ value }: { value: unknown }) {
  return typeof value === 'string' ? value.trim() : value;
}

export class UpsertProfileDto implements UpsertProfileInput {
  @Transform(trimString)
  @IsString()
  @Matches(NON_WHITESPACE_PATTERN)
  fullName!: string;

  @Transform(trimString)
  @IsString()
  @Matches(NON_WHITESPACE_PATTERN)
  headline!: string;

  @Transform(trimString)
  @IsString()
  @Matches(NON_WHITESPACE_PATTERN)
  biography!: string;

  @Transform(trimString)
  @IsString()
  @Matches(NON_WHITESPACE_PATTERN)
  location!: string;

  @Transform(trimString)
  @IsEmail()
  email!: string;

  @ValidateIf((_, value) => value !== undefined && value !== null)
  @Transform(trimString)
  @IsUrl()
  githubUrl?: string | null;

  @ValidateIf((_, value) => value !== undefined && value !== null)
  @Transform(trimString)
  @IsUrl()
  linkedinUrl?: string | null;
}
