import { NON_WHITESPACE_PATTERN } from '@antin-os/shared';
import type { UpdateCertificationInput } from '@antin-os/shared';
import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsDateString,
  IsInt,
  IsString,
  IsUrl,
  Matches,
  Min,
  ValidateIf,
} from 'class-validator';
import { trimString } from './create-education.dto';

export class UpdateCertificationDto implements UpdateCertificationInput {
  @ValidateIf((_, value) => value !== undefined)
  @Transform(trimString)
  @IsString()
  @Matches(NON_WHITESPACE_PATTERN)
  name?: string;

  @ValidateIf((_, value) => value !== undefined)
  @Transform(trimString)
  @IsString()
  @Matches(NON_WHITESPACE_PATTERN)
  issuer?: string;

  @ValidateIf((_, value) => value !== undefined && value !== null)
  @Transform(trimString)
  @IsDateString()
  issueDate?: string | null;

  @ValidateIf((_, value) => value !== undefined && value !== null)
  @Transform(trimString)
  @IsDateString()
  expirationDate?: string | null;

  @ValidateIf((_, value) => value !== undefined && value !== null)
  @Transform(trimString)
  @IsString()
  @Matches(NON_WHITESPACE_PATTERN)
  credentialId?: string | null;

  @ValidateIf((_, value) => value !== undefined && value !== null)
  @Transform(trimString)
  @IsUrl({ require_protocol: true })
  credentialUrl?: string | null;

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
