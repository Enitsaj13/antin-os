import type { ReorderExperienceInput } from '@antin-os/shared';
import { Type } from 'class-transformer';
import {
  ArrayNotEmpty,
  IsArray,
  IsInt,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';

class ReorderExperienceItemDto {
  @IsString()
  id!: string;

  @IsInt()
  @Min(0)
  displayOrder!: number;
}

export class ReorderExperienceDto implements ReorderExperienceInput {
  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => ReorderExperienceItemDto)
  items!: ReorderExperienceItemDto[];
}
