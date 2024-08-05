import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { AttendantsService } from './attendants.service';
import { CreateAttendantDto } from './dto/create-attendant.dto';
import { UpdateAttendantDto } from './dto/update-attendant.dto';

@Controller('attendants')
export class AttendantsController {
  constructor(private readonly attendantsService: AttendantsService) {}

  @Post()
  create(@Body() createAttendantDto: CreateAttendantDto) {
    return this.attendantsService.create(createAttendantDto);
  }

  @Get()
  findAll() {
    return this.attendantsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.attendantsService.findOne(+id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateAttendantDto: UpdateAttendantDto,
  ) {
    return this.attendantsService.update(+id, updateAttendantDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.attendantsService.remove(+id);
  }
}
