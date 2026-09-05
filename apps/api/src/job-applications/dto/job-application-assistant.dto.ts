import {
  JOB_APPLICATION_ASSISTANT_OPERATIONS,
  type JobApplicationAssistantInput,
  type JobApplicationAssistantOperation,
} from '@antin-os/shared';
import { IsIn } from 'class-validator';

export class JobApplicationAssistantDto implements JobApplicationAssistantInput {
  @IsIn(JOB_APPLICATION_ASSISTANT_OPERATIONS)
  operation!: JobApplicationAssistantOperation;
}
