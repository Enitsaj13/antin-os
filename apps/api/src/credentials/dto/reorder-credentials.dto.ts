import type { ReorderCredentialsInput } from '@antin-os/shared';
import { Type } from 'class-transformer';
import {
  ArrayNotEmpty,
  IsArray,
  IsInt,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';

class ReorderCredentialItemDto {
  @IsString()
  id!: string;

  @IsInt()
  @Min(0)
  displayOrder!: number;
}

export class ReorderCredentialsDto implements ReorderCredentialsInput {
  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => ReorderCredentialItemDto)
  items!: ReorderCredentialItemDto[];
}
