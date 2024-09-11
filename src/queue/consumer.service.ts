import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Worker, Queue, Job, RedisConnection } from 'bullmq';
import { PrismaService } from 'prisma/prisma.service';

@Injectable()
export class ConsumerService {
  constructor(
    @InjectQueue('') private readonly queue: Queue,
    private prisma: PrismaService,
  ) {}

  async processNextTicket(attendantId: string, prisma: PrismaService) {
    const worker = new Worker(
      `attendant-queue-${attendantId}`,
      async (job: Job) => {
        console.log(`Processing next ticket for attendant: ${attendantId}`);

        // Mover job para a fila central de atendimento
        await processingQueue.add('ticket-processing', job.data);

        // Atualizar status do ticket no banco de dados
        await prisma.ticket.update({
          where: { id: job.data.ticketId },
          data: { status: 'PROCESSING' },
        });

        console.log(`Ticket ${job.data.ticketId} moved to processing queue.`);
      },
      { connection: { host: 'redis', port: 6379 } }
    );

    worker.on('completed', (job) => {
      console.log(`Job ${job.id} completed sucessfully`);
    });

    worker.on('failed', (job, err) => {
      console.error(`Job ${job.id} failed with error: ${err.message}`);
    });
  }
}
