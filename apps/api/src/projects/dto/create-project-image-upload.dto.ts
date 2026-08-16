import {
  PROJECT_IMAGE_MAX_BYTES,
  PROJECT_IMAGE_MIME_TYPES,
} from '@antin-os/shared';
import type { CreateProjectImageUploadInput } from '@antin-os/shared';
import { IsIn, IsInt, IsNotEmpty, IsString, Max, Min } from 'class-validator';
import { Transform } from 'class-transformer';

function trimString({ value }: { value: unknown }) {
  return typeof value === 'string' ? value.trim() : value;
}

export class CreateProjectImageUploadDto implements CreateProjectImageUploadInput {
  @Transform(trimString)
  @IsString()
  @IsNotEmpty()
  fileName!: string;

  @Transform(trimString)
  @IsString()
  @IsIn(PROJECT_IMAGE_MIME_TYPES)
  contentType!: string;

  @IsInt()
  @Min(1)
  @Max(PROJECT_IMAGE_MAX_BYTES)
  size!: number;
}
