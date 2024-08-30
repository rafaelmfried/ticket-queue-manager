import { IsString, IsEnum } from 'class-validator';
import { DocumentType } from '@prisma/client';

export class CreateClientDto {
  @IsString()
  name: string;
  @IsString()
  phone: string;
  @IsEnum(DocumentType)
  documentType: DocumentType;
  @IsString()
  documentNumber: string;
}
