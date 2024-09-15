import { Role, QueueStatus } from '@prisma/client';
import {
  IsString,
  IsEmail,
  IsArray,
  IsEnum,
  IsInt,
  IsOptional,
} from 'class-validator';

export class ConnectServiceDto {
  @IsString()
  id: string;
}

export class CreateAttendantDto {
  @IsString()
  name: string;

  @IsEmail()
  email: string;

  @IsString()
  password: string;

  @IsArray()
  @IsEnum(Role, { each: true })
  roles: Role[];

  @IsEnum(QueueStatus)
  queueStatus: QueueStatus;

  @IsInt()
  queueLimit: number;

  @IsOptional()
  @IsString({ each: true })
  serviceIds?: string[];
}
