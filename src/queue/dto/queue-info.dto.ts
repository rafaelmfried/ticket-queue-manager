import { Queue } from 'bullmq';
import { IsBoolean, IsObject, IsString } from 'class-validator';

export class QueueInfoDto {
  queue: Queue;
  @IsString()
  name: string;
  @IsBoolean()
  paused: boolean;
  @IsObject()
  ticketCount: object;
}
