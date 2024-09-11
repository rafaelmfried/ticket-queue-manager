import { Controller, Post, Get, Param, Body, Delete } from '@nestjs/common';
import { QueueService } from './queue.service';
import { CreateQueueDto } from './dto/create-queue.dto';
import { JobStatusDto } from './dto/jobs-info.dto';

@Controller('queues')
export class QueueController {
  constructor(private readonly queueService: QueueService) {}

  @Post()
  createQueue(@Body() createQueueDto: CreateQueueDto) {
    return this.queueService.createQueue(createQueueDto);
  }

  @Get(':attendantId')
  getQueue(@Param('attendantId') attendantId: string) {
    return this.queueService.getQueue(attendantId);
  }

  @Get(':attendantId/jobs')
  getJobs(
    @Param('attendantId') attendantId: string,
    @Body() jobStatusDto: JobStatusDto,
  ) {
    return this.queueService.getJobs(attendantId, jobStatusDto);
  }

  @Post(':attendantId/jobs')
  addJob(@Param('attendantId') attendantId: string, @Body() jobData: any) {
    return this.queueService.addJob(attendantId, jobData);
  }

  @Delete(':attendantId/jobs/:jobId')
  removeJob(
    @Param('attendantId') attendantId: string,
    @Param('jobId') jobId: string,
  ) {
    return this.queueService.removeJob(attendantId, jobId);
  }
}
