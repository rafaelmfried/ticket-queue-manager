import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { Worker, Job } from 'bullmq';
import { QueueService } from 'src/queue/queue.service';
import { UpdateTicketDto } from 'src/tickets/dto/update-ticket.dto';
import { TicketsService } from 'src/tickets/tickets.service';
import { CreateTicketDto } from 'src/tickets/dto/create-ticket.dto';
import { CreateQueueDto } from 'src/queue/dto/create-queue.dto';

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
    queueName: string,
    ticketId: string,
    jobData: any,
  ) {
    const { queue } = await this.queueService.getQueue(queueName);
    await queue.add(`processing-ticket-${queueName}-${ticketId}`, jobData);
  }

  private async handleJobCompletion(job: Job) {
    const { queueName, ticketId } = job.data;
    try {
      await this.finalizeTicket(queueName, ticketId);
    } catch (error) {
      console.error(`Error finalizing ticket ${ticketId}:`, error);
    }
  }

  private async handleJobFailure(job: Job, err: Error) {
    console.error(`Job ${job.id} failed with error:`, err);
  }

  async finalizeTicket(queueName: string, ticketId: string) {
    const { queue: processingQueue } =
      await this.queueService.getQueue('tickets-in-process');
    this.queueService.getQueue(queueName);

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
      `Ticket ${ticketId} moved to completed for attendant ${queueName}.`,
    );
  }

  async processNextTicket(queueName: string) {
    const { queue: attendantQueue } =
      await this.queueService.getQueue(queueName);

    if (!attendantQueue)
      throw new Error(`Queue for attendant ${queueName} not found.`);

    const jobs = await attendantQueue.getJobs(['waiting']);
    if (jobs.length === 0) {
      console.log('No jobs available for processing.');
      return;
    }

    const job = jobs[0]; // Process the first available job
    await this.moveJobToProcessingQueue(queueName, job.id, job.data);
    const ticketStatusDto = new UpdateTicketDto();
    ticketStatusDto.status = 'PROCESSING';
    await this.updateTicketStatus(job.data.ticketId, ticketStatusDto);
    console.log(`Ticket ${job.data.ticketId} moved to processing queue.`);
  }

  // Função para alterar o status da fila do atendente
  async changeAttendantQueueStatus(
    queueName: string,
    status: 'OPEN' | 'CLOSED',
  ) {
    // Atualize o status do atendente no banco de dados ou na lógica de negócio
    // Isso poderia ser feito no AttendantsService ou aqui, dependendo da sua arquitetura
    if (status === 'OPEN') {
      // Cria a fila do atendente se o status for "open"
      await this.createQueueForAttendant(queueName);
    } else {
      // Fechar a fila se o status for "closed"
      await this.queueService.removeQueue(queueName);
    }

    console.log(
      `Status da fila do atendente ${queueName} alterado para ${status}`,
    );
  }

  // Função para criar a fila para o atendente
  private async createQueueForAttendant(queueName: string) {
    // Verifica se a fila já existe
    const { queue } = await this.queueService.getQueue(queueName);
    if (queue) {
      console.log(`Fila para atendente ${queueName} já existe.`);
      return;
    }

    const createQueueDto = new CreateQueueDto();
    createQueueDto.name = `attendant-queue-${queueName}`;

    // Cria a fila do atendente se ela não existir
    await this.queueService.createQueue(createQueueDto);
    console.log(`Fila criada para o atendente ${queueName}.`);
  }

  private async updateTicketStatus(
    ticketId: string,
    updateTicketDto: UpdateTicketDto,
  ) {
    await this.ticketService.update(ticketId, updateTicketDto);
  }
}
