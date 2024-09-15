import { CreateAttendantDto } from './create-attendant.dto';
import { PartialType } from '@nestjs/mapped-types';

export class UpdateAttendantDto extends PartialType(CreateAttendantDto) {}
