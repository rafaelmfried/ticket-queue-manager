import {
  Controller,
  Get,
  Post,
  Body,
  // Patch,
  Param,
  // Delete,
} from '@nestjs/common';
import { QueueService } from './queue.service';
import { CreateQueueDto } from './dto/create-queue.dto';
// import { UpdateQueueDto } from './dto/update-queue.dto';

@Controller('queue')
export class QueueController {
  constructor(private readonly queueService: QueueService) {}

  @Post()
  async create(@Body() createQueueDto: CreateQueueDto) {
    return await this.queueService.createQueue(createQueueDto);
  }

  @Get(':attendantId')
  async getQueue(@Param('attendantId') attendantId: string) {
    return await this.queueService.getQueue(attendantId);
  }

  @Get()
  async listQueues() {
    return await this.queueService.listQueues();
  }

  @Post(':attendantId/job')
  async addJob(
    @Param('attendantId') attendantId: string,
    @Body('status') status: Array<'waiting' | 'active' | 'completed'>,
  ) {
    return await this.queueService.addJob(attendantId, status);
  }

  // @Get(':id')
  // findOne(@Param('id') id: string) {
  //   return this.queueService.findOne(+id);
  // }

  // @Patch(':id')
  // update(@Param('id') id: string, @Body() updateQueueDto: UpdateQueueDto) {
  //   return this.queueService.update(+id, updateQueueDto);
  // }

  // @Delete(':id')
  // remove(@Param('id') id: string) {
  //   return this.queueService.remove(+id);
  // }
}
