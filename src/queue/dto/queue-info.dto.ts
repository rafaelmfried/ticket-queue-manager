import { IsBoolean, IsObject, IsString } from 'class-validator';

export class QueueInfoDto {
  @IsString()
  name: string;
  @IsBoolean()
  paused: boolean;
  @IsObject()
  ticketCount: object;
}
