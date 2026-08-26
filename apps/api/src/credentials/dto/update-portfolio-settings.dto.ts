import type { UpdatePortfolioSettingsInput } from '@antin-os/shared';
import { IsBoolean, ValidateIf } from 'class-validator';

export class UpdatePortfolioSettingsDto implements UpdatePortfolioSettingsInput {
  @ValidateIf((_, value) => value !== undefined)
  @IsBoolean()
  showEducation?: boolean;

  @ValidateIf((_, value) => value !== undefined)
  @IsBoolean()
  showCertifications?: boolean;
}
