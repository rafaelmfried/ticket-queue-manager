import { Role, QueueStatus } from '@prisma/client';
import {
  IsString,
  IsEmail,
  IsArray,
  IsEnum,
  IsInt,
  IsOptional,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class ConnectServiceDto {
  @IsString()
  id: string;
}

export class UpdateAttendantDto {
  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  password?: string;

  @IsOptional()
  @IsArray()
  @IsEnum(Role, { each: true })
  roles?: Role[];

  @IsOptional()
  @IsEnum(QueueStatus)
  queueStatus?: QueueStatus;

  @IsOptional()
  @IsInt()
  queueLimit?: number;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ConnectServiceDto)
  services?: ConnectServiceDto[];
}
