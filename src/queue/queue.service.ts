import { Injectable, NotFoundException } from '@nestjs/common';
import { Queue } from 'bullmq';
import { CreateQueueDto } from './dto/create-queue.dto';
import { QueueInfoDto } from './dto/queue-info.dto';
import { JobStatusDto } from './dto/jobs-info.dto';

@Injectable()
export class QueueService {
  private queues: Map<string, Queue> = new Map();

  async createQueue(createQueueDto: CreateQueueDto): Promise<QueueInfoDto> {
    const name = createQueueDto.name;

    if (!this.queues.has(name)) {
      const queue = new Queue(name, {
        connection: { host: 'redis', port: 6379 },
      });
      this.queues.set(name, queue);
      console.log(`Fila ${name} criada e adicionada ao Map.`);
    } else {
      console.log(`Fila ${name} já existe.`);
    }

    const queue = this.queues.get(name);
    const jobCounts = await queue.getJobCounts();
    const isPaused = await queue.isPaused();

    return {
      queue,
      name: queue.name,
      ticketCount: jobCounts,
      paused: isPaused,
    };
  }

  async getQueue(name: string): Promise<QueueInfoDto> {
    const queue = this.queues.get(name);

    if (!queue) {
      throw new NotFoundException(`Queue for attendant ${name} not found.`);
    }

    const ticketCount = await queue.getJobCounts();
    const paused = await queue.isPaused();

    return {
      queue,
      name,
      ticketCount,
      paused,
    };
  }

  async listQueues(): Promise<QueueInfoDto[]> {
    const queueList: QueueInfoDto[] = [];

    for (const [name, queue] of this.queues.entries()) {
      const jobCounts = await queue.getJobCounts();
      const isPaused = await queue.isPaused();

      queueList.push({
        name,
        ticketCount: jobCounts,
        paused: isPaused,
      });
    }

    return queueList;
  }

  async addJob(attendantId: string, jobData: any): Promise<string> {
    const queue = this.queues.get(attendantId);
    if (!queue) {
      throw new NotFoundException(
        `Queue for attendant ${attendantId} not found.`,
      );
    }

    const job = await queue.add('process-job', jobData);
    return job.id;
  }

  async getJobs(attendantId: string, jobStatusDto: JobStatusDto) {
    const queue = this.queues.get(attendantId);
    if (!queue) {
      throw new NotFoundException(
        `Queue for attendant ${attendantId} not found.`,
      );
    }

    const jobs = await queue.getJobs(jobStatusDto.status);
    return { jobs };
  }

  async removeJob(attendantId: string, jobId: string) {
    const queue = this.queues.get(attendantId);
    if (!queue) {
      throw new NotFoundException(
        `Queue for attendant ${attendantId} not found.`,
      );
    }

    const job = await queue.getJob(jobId);
    if (!job) {
      throw new NotFoundException(`Job with ID ${jobId} not found.`);
    }

    await job.remove();
    return { success: true };
  }
}
