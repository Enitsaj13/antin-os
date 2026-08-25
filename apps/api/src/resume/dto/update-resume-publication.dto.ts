import { IsBoolean } from 'class-validator';

export class UpdateResumePublicationDto {
  @IsBoolean()
  isPublic!: boolean;
}
