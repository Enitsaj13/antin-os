import type { AdminLoginInput } from '@antin-os/shared';
import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString } from 'class-validator';

function trimString({ value }: { value: unknown }) {
  return typeof value === 'string' ? value.trim() : value;
}

export class LoginDto implements AdminLoginInput {
  @Transform(trimString)
  @IsString()
  @IsNotEmpty()
  username!: string;

  @IsString()
  @IsNotEmpty()
  password!: string;
}
