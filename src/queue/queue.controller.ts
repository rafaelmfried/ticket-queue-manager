import {
  Controller,
  Get,
  Post,
  Body,
  // Patch,
  Param,
  Delete,
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
    const jobId = await this.queueService.addJob(attendantId, status);
    return jobId;
  }

  @Get(':attendantId/:status')
  async getTickets(
    @Param('attendantId') attendantId: string,
    @Param('status') status: Array<'waiting' | 'active' | 'completed'>,
  ) {
    return this.queueService.getJobs(attendantId, status);
  }

  // @Patch(':id')
  // update(@Param('id') id: string, @Body() updateQueueDto: UpdateQueueDto) {
  //   return this.queueService.update(+id, updateQueueDto);
  // }

  @Delete(':attendantId')
  remove(
    @Param('attendantId') attendantId: string,
    @Body('jobId') jobId: string,
  ) {
    return this.queueService.removeJob(attendantId, jobId);
  }
}
