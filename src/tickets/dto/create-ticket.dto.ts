import { IsNotEmpty, IsString, IsEnum } from 'class-validator';
import { TicketStatus } from '@prisma/client';

export class CreateTicketDto {
  @IsNotEmpty()
  @IsString()
  serviceId: string;

  @IsString()
  attendantId: string;

  @IsNotEmpty()
  @IsString()
  clientId: string;

  @IsEnum(TicketStatus)
  status: TicketStatus;
}
