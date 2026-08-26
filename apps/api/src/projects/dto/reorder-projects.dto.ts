import type { ReorderProjectInput } from '@antin-os/shared';
import { Type } from 'class-transformer';
import {
  ArrayNotEmpty,
  IsArray,
  IsInt,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';

class ReorderProjectItemDto {
  @IsString()
  id!: string;

  @IsInt()
  @Min(0)
  displayOrder!: number;
}

export class ReorderProjectsDto implements ReorderProjectInput {
  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => ReorderProjectItemDto)
  items!: ReorderProjectItemDto[];
}
