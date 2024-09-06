import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
} from '@nestjs/common';
import { QueueService } from './queue.service';
import { CreateQueueDto } from './dto/create-queue.dto';
import { JobStatusDto } from './dto/jobs-info.dto';
import { JobType as BullMQJobType } from 'bullmq';
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
    @Body('status') jobStatusDto: JobStatusDto,
  ) {
    const jobId = await this.queueService.addJob(
      attendantId,
      jobStatusDto.status,
    );
    return jobId;
  }

  @Get(':attendantId/jobs')
  async getTickets(
    @Param('attendantId') attendantId: string,
    @Query('status') status: string,
  ) {
    const statusArray = status.split(',') as BullMQJobType[];
    const validStatusArray: BullMQJobType[] = statusArray.filter((s) =>
      [
        'waiting',
        'active',
        'completed',
        'failed',
        'paused',
        'repeat',
        'wait',
        'delayed',
        'prioritized',
        'waiting-children',
      ].includes(s),
    );
    const jobStatusDto = new JobStatusDto();
    jobStatusDto.status = validStatusArray;
    return this.queueService.getJobs(attendantId, jobStatusDto);
  }

  @Patch(':attendantId/jobs/:jobId')
  async updateJob(
    @Param('attendantId') attendantId: string,
    @Param('jobId') jobId: string,
    @Body() updates: { status: string; delay?: number },
  ) {
    const result = await this.queueService.updateJob(
      attendantId,
      jobId,
      updates,
    );
    if (result.success) {
      return { message: 'Job updated successfully' };
    }
    return { message: result.message };
  }

  @Delete(':attendantId')
  remove(
    @Param('attendantId') attendantId: string,
    @Body('jobId') jobId: string,
  ) {
    return this.queueService.removeJob(attendantId, jobId);
  }
}
