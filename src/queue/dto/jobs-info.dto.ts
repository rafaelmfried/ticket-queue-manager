import { IsArray, IsEnum } from 'class-validator';

export enum JobStatusEnum {
  waiting = 'waiting',
  active = 'active',
  completed = 'completed',
}

export class JobStatusDto {
  @IsArray()
  @IsEnum(JobStatusEnum, { each: true })
  status: JobStatusEnum[];
}
