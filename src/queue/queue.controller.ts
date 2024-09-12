import { Controller, Post, Get, Param, Body, Delete } from '@nestjs/common';
import { QueueService } from './queue.service';
import { CreateQueueDto } from './dto/create-queue.dto';
import { JobStatusDto } from './dto/jobs-info.dto';

@Controller('queues')
export class QueueController {
  constructor(private readonly queueService: QueueService) {}

  @Get()
  async listQueues() {
    return await this.queueService.listQueues();
  }

  @Post()
  async createQueue(@Body() createQueueDto: CreateQueueDto) {
    return await this.queueService.createQueue(createQueueDto);
  }

  @Get(':attendantId')
  async getQueue(@Param('attendantId') attendantId: string) {
    const queueName =
      (new CreateQueueDto().name = `attendant-queue-${attendantId}`);
    const { queue, ...response } = await this.queueService.getQueue(queueName);
    console.log(queue);
    return response;
  }

  @Get(':attendantId/jobs')
  async getJobs(
    @Param('attendantId') attendantId: string,
    @Body() jobStatusDto: JobStatusDto,
  ) {
    const queueName =
      (new CreateQueueDto().name = `attendant-queue-${attendantId}`);
    return await this.queueService.getJobs(queueName, jobStatusDto);
  }

  @Post(':attendantId/jobs')
  async addJob(
    @Param('attendantId') attendantId: string,
    @Body() jobData: any,
  ) {
    const queueName =
      (new CreateQueueDto().name = `attendant-queue-${attendantId}`);
    return await this.queueService.addJob(queueName, jobData);
  }

  @Delete(':attendantId/jobs/:jobId')
  async removeJob(
    @Param('attendantId') attendantId: string,
    @Param('jobId') jobId: string,
  ) {
    const queueName =
      (new CreateQueueDto().name = `attendant-queue-${attendantId}`);
    return await this.queueService.removeJob(queueName, jobId);
  }
}
