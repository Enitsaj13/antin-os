import { NON_WHITESPACE_PATTERN } from '@antin-os/shared';
import type { CreateCertificationInput } from '@antin-os/shared';
import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsString,
  IsUrl,
  Matches,
  Min,
  ValidateIf,
} from 'class-validator';
import { trimString } from './create-education.dto';

export class CreateCertificationDto implements CreateCertificationInput {
  @Transform(trimString)
  @IsString()
  @IsNotEmpty()
  name!: string;

  @Transform(trimString)
  @IsString()
  @IsNotEmpty()
  issuer!: string;

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
