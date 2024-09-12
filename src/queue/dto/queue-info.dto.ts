import { Queue } from 'bullmq';
import { Type } from 'class-transformer';
import { IsBoolean, IsObject, IsOptional, IsString } from 'class-validator';

export class QueueInfoDto {
  @IsOptional()
  @Type(() => Object)
  queue?: Queue;
  @IsString()
  name: string;
  @IsBoolean()
  paused: boolean;
  @IsObject()
  ticketCount: object;
}
