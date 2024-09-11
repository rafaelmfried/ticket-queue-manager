import { Injectable } from '@nestjs/common';
import { ConnectionOptions, Queue } from 'bullmq';
import { TicketsService } from 'src/tickets/tickets.service';

@Injectable()
export class ProducerService {
  private queues: Map<string, Queue>;

  constructor(private ticketService: TicketsService) {
    this.queues = new Map();
  }

  private getQueue(attendantId: string): Queue {
    if (this.queues.has(attendantId)) {
      return this.queues.get(attendantId);
    }

    const queue = new Queue(`queue-${attendantId}`, {
      connection: {
        host: 'redis',
        port: 6379,
      } as ConnectionOptions,
    });
    this.queues.set(attendantId, queue);
    return queue;
  }

  async createQueue(attendantId: string) {
    this.getQueue(attendantId);
  }

  async addJob(attendantId: string, jobData: any) {
    const queue = this.getQueue(attendantId);
    return queue.add('ticket', jobData);
  }

  async removeJob(attendantId: string, jobId: string) {
    const queue = this.getQueue(attendantId);
    const job = await queue.getJob(jobId);
    if (job) {
      return job.remove();
    }
    return null;
  }

  async getJobs(attendantId: string) {
    const queue = this.getQueue(attendantId);
    return queue.getJobs();
  }

  async updateJobPriority(
    attendantId: string,
    jobId: string,
    priority: number,
  ) {
    const queue = this.getQueue(attendantId);
    const job = await queue.getJob(jobId);
    if (job) {
      const jobData = job.data;
      await job.remove();
      return queue.add('ticket', jobData, { priority });
    }
    return null;
  }

  async createTicket(clientId: string, serviceId: string, attendantId: string) {
    const ticket = await this.ticketService.create({
      clientId,
      serviceId,
      attendantId,
      status: 'OPEN',
    });
    const queue = this.getQueue(attendantId);
    await queue.add('ticket', { ticketId: ticket.id, clientId, attendantId });
    return ticket;
  }

  async processJob(attendantId: string, job: any) {
    const { ticketId } = job.data;

    await this.ticketService.update(ticketId, { status: 'CLOSED' });

    await job.moveToCompleted();
  }
}
