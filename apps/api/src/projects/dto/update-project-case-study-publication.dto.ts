import type { UpdateProjectCaseStudyPublicationInput } from '@antin-os/shared';
import { IsBoolean } from 'class-validator';

export class UpdateProjectCaseStudyPublicationDto implements UpdateProjectCaseStudyPublicationInput {
  @IsBoolean()
  isPublic!: boolean;
}
