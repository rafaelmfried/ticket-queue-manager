import { IsString } from 'class-validator';

export class CreateWorkerDto {
  @IsString()
  queueName: string;
}
