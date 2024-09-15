// src/attendants/attendants.controller.ts

import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Delete,
} from '@nestjs/common';
import { AttendantsService } from './attendants.service';
import { CreateAttendantDto } from './dto/create-attendant.dto';
import { UpdateAttendantDto } from './dto/update-attendant.dto';
import { WorkersService } from 'src/workers/workers.service';

@Controller('attendants')
export class AttendantsController {
  constructor(
    private readonly attendantService: AttendantsService,
    private readonly workersService: WorkersService,
  ) {}

  @Patch(':attendantId/queue-status')
  async changeQueueStatus(
    @Param('attendantId') attendantId: string,
    @Body('status') status: 'OPEN' | 'CLOSED',
  ) {
    const updatedAttendant = await this.attendantService.changeQueueStatus(
      attendantId,
      status,
    );
    return {
      message: `Status da fila alterado para ${status}`,
      attendant: updatedAttendant,
    };
  }

  @Post(':attendantId/process-next-ticket')
  async processNextTicket(@Param('attendantId') attendantId: string) {
    try {
      await this.workersService.processNextTicket(attendantId);
      return {
        message: `Próximo ticket processado para o atendente ${attendantId}`,
      };
    } catch (error) {
      return { error: `Erro ao processar próximo ticket: ${error.message}` };
    }
  }

  @Patch(':attendantId/finalize-ticket/:ticketId')
  async finalizeTicket(
    @Param('attendantId') attendantId: string,
    @Param('ticketId') ticketId: string,
  ) {
    try {
      await this.workersService.finalizeTicket(attendantId, ticketId);
      return {
        message: `Ticket ${ticketId} finalizado para o atendente ${attendantId}`,
      };
    } catch (error) {
      return { error: `Erro ao finalizar o ticket: ${error.message}` };
    }
  }

  @Post()
  create(@Body() createAttendantDto: CreateAttendantDto) {
    return this.attendantService.create(createAttendantDto);
  }

  @Get()
  findAll() {
    return this.attendantService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.attendantService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateAttendantDto: UpdateAttendantDto,
  ) {
    return this.attendantService.update(id, updateAttendantDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.attendantService.remove(id);
  }
}
