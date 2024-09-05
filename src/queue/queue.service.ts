import { Injectable } from '@nestjs/common';
import { Queue, Worker } from 'bullmq';
import { CreateQueueDto } from './dto/create-queue.dto';
// import { UpdateQueueDto } from './dto/update-queue.dto';

@Injectable()
export class QueueService {
  private queues: Map<string, Queue> = new Map();
  private workers: Map<string, Worker> = new Map();

  async createQueue(createQueueDto: CreateQueueDto): Promise<Queue> {
    const name = createQueueDto.name;

    if (!this.queues.has(name)) {
      const queue = new Queue(name, {
        connection: {
          host: 'redis',
          port: 6379,
        },
      });

      const worker = new Worker(
        name,
        async (job) => {
          console.log(`Processing job in ${name}:`, job.id);
          console.log('Job data:', job.data);
          //  Process your job here
        },
        {
          connection: {
            host: 'redis',
            port: 6379,
          },
        },
      );
      this.queues.set(name, queue);
      this.workers.set(name, worker);
    }
    return this.queues.get(name);
  }

  async getQueue(attendantId: string): Promise<Queue> {
    console.log(attendantId);
    const queue = await this.queues.get(attendantId);
    console.log(queue);
    return queue;
  }

  async listQueues(): Promise<string[]> {
    return Array.from(await this.queues.keys());
  }

  async addJob(attendantId: string, jobData: any) {
    const queue = await this.getQueue(attendantId);
    return await queue.add('process-job', jobData);
  }

  async getJobs(
    attendantId: string,
    status: Array<'waiting' | 'active' | 'completed'>,
  ) {
    const queue = await this.getQueue(attendantId);
    return await queue.getJobs(status);
  }

  async removeJob(attendantId: string, jobId: string) {
    const queue = await this.getQueue(attendantId);
    const job = await queue.getJob(jobId);
    if (job) {
      await job.remove();
      return { success: true };
    }
    return { success: false, message: 'Job not found!' };
  }

  // async updateJob(attendantId: string, jobId: string, updates: any) {
  //   const queue = await this.getQueue(attendantId);
  //   const job = await queue.getJob(jobId);
  //   if (job) {
  //     await job.update(updates);
  //     return { success: true };
  //   }
  //   return { success: false, message: 'Job not found!' };
  // }

  // async processJob(attendantId: string, processor: (job: Job) => Promise<any>) {
  //   if (!this.workers.has(attendantId))
  //     return { success: false, message: 'Queue not found for this attendant' };
  // }
}
