import { IsString } from 'class-validator';

export class CreateQueueDto {
  @IsString()
  name: string;
}
