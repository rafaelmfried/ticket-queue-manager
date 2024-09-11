import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { Worker, Job } from 'bullmq';
import { QueueService } from 'src/queue/queue.service';
import { CreateQueueDto } from 'src/queue/dto/create-queue.dto';
import { UpdateTicketDto } from 'src/tickets/dto/update-ticket.dto';
import { TicketsService } from 'src/tickets/tickets.service';
import { CreateTicketDto } from 'src/tickets/dto/create-ticket.dto';

@Injectable()
export class WorkersService implements OnModuleDestroy {
  private workers: Map<string, Worker> = new Map(); // Armazena os workers criados

  constructor(
    private readonly queueService: QueueService,
    private readonly ticketService: TicketsService,
  ) {
    this.initializeGeneralWorker(); // Inicializa o worker geral
  }
  async onModuleDestroy() {
    for (const worker of this.workers.values()) {
      await worker.close();
      console.log('Worker closed.');
    }
  }

  private async initializeGeneralWorker() {
    const worker = new Worker(
      'general-worker',
      (job: Job) => this.handleGeneralWorkerJob(job),
      { connection: { host: 'redis', port: 6379 } },
    );

    worker.on('completed', (job) => this.handleJobCompletion(job));
    worker.on('failed', (job, err) => this.handleJobFailure(job, err));

    this.workers.set('general-worker', worker);
  }

  private async handleGeneralWorkerJob(job: Job) {
    const { attendantId, ticketId } = job.data;
    try {
      await this.moveJobToProcessingQueue(attendantId, ticketId, job.data);
      const ticketStatusDto = new UpdateTicketDto();
      ticketStatusDto.status = 'PROCESSING';
      await this.updateTicketStatus(ticketId, ticketStatusDto);
    } catch (error) {
      console.error(`Error processing job ${job.id}:`, error);
      throw error;
    }
  }

  private async moveJobToProcessingQueue(
    attendantId: string,
    ticketId: string,
    jobData: any,
  ) {
    const ticketsInProcessQueueDto = new CreateQueueDto();
    ticketsInProcessQueueDto.name = 'tickets-in-process';

    const { queue } = await this.queueService.createQueue(
      ticketsInProcessQueueDto,
    );
    await queue.add(`processing-ticket-${attendantId}-${ticketId}`, jobData);
  }

  private async handleJobCompletion(job: Job) {
    const { attendantId, ticketId } = job.data;
    try {
      await this.finalizeTicket(attendantId, ticketId);
    } catch (error) {
      console.error(`Error finalizing ticket ${ticketId}:`, error);
    }
  }

  private async handleJobFailure(job: Job, err: Error) {
    console.error(`Job ${job.id} failed with error:`, err);
  }

  private async finalizeTicket(attendantId: string, ticketId: string) {
    const { queue: processingQueue } =
      await this.queueService.getQueue('tickets-in-process');
    this.queueService.getQueue(attendantId);

    const processingJob = await processingQueue.getJob(ticketId);
    if (!processingJob)
      throw new Error('Ticket not found in processing queue.');

    await processingJob.moveToCompleted(
      `Ticket ${ticketId} completed`,
      processingJob.token,
    );
    const ticketStatusDto = new CreateTicketDto();
    ticketStatusDto.status = 'CLOSED';
    await this.ticketService.update(ticketId, ticketStatusDto);

    console.log(
      `Ticket ${ticketId} moved to completed for attendant ${attendantId}.`,
    );
  }

  async processNextTicket(attendantId: string) {
    const { queue: attendantQueue } =
      await this.queueService.getQueue(attendantId);

    if (!attendantQueue)
      throw new Error(`Queue for attendant ${attendantId} not found.`);

    const jobs = await attendantQueue.getJobs(['waiting']);
    if (jobs.length === 0) {
      console.log('No jobs available for processing.');
      return;
    }

    const job = jobs[0]; // Process the first available job
    await this.moveJobToProcessingQueue(attendantId, job.id, job.data);
    const ticketStatusDto = new UpdateTicketDto();
    ticketStatusDto.status = 'PROCESSING';
    await this.updateTicketStatus(job.data.ticketId, ticketStatusDto);
    console.log(`Ticket ${job.data.ticketId} moved to processing queue.`);
  }

  private async updateTicketStatus(
    ticketId: string,
    updateTicketDto: UpdateTicketDto,
  ) {
    await this.ticketService.update(ticketId, updateTicketDto);
  }
}
