import type { CreateCaseStudyDraftInput } from '@antin-os/shared';
import { Transform } from 'class-transformer';
import { IsString, ValidateIf } from 'class-validator';

function trimString({ value }: { value: unknown }) {
  return typeof value === 'string' ? value.trim() : value;
}

export class CreateCaseStudyDraftDto implements CreateCaseStudyDraftInput {
  @ValidateIf((_, value) => value !== undefined)
  @Transform(trimString)
  @IsString()
  notes?: string;
}
