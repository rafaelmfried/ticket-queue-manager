import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { Worker, Job } from 'bullmq';

@Injectable()
export class WorkersService implements OnModuleDestroy {
  private workers: Map<string, Worker> = new Map();

  async createWorker(queueName: string): Promise<void> {
    if (!this.workers.has(queueName)) {
      const worker = new Worker(
        queueName,
        async (job: Job) => {
          try {
            console.log(`Processing job ${job.id} from queue ${queueName}`);
            console.log('Job data:', job.data);

            // Sua lógica de processamento de jobs aqui
            await this.processJob(job);
          } catch (error) {
            console.error(`Job ${job.id} failed:`, error);
            throw error; // O job falhará e será movido para a fila de falhas
          }
        },
        {
          connection: {
            host: 'redis',
            port: 6379,
          },
        },
      );

      // Define comportamento em caso de falhas
      worker.on('failed', (job, err) => {
        console.error(`Job ${job.id} failed with error:`, err.message);
      });

      worker.on('completed', (job) => {
        console.log(`Job ${job.id} completed successfully`);
      });

      // Adiciona o worker à lista de workers gerenciados
      this.workers.set(queueName, worker);
    }
  }

  // Lógica para processar o job
  async processJob(job: Job): Promise<void> {
    // Aqui você pode adicionar lógica de processamento
    console.log('Processing job data:', job.data);

    // Exemplo: adicionar lógica customizada com base nos dados do job
    if (job.data.type === 'example') {
      // Processa um job do tipo 'example'
      console.log('Processing example job type');
    }

    // Se o job for bem-sucedido, ele será movido para o estado de completado automaticamente
  }

  // Método para encerrar os workers quando o módulo for destruído
  async onModuleDestroy() {
    for (const [name, worker] of this.workers.entries()) {
      console.log(`Closing worker for queue: ${name}`);
      await worker.close();
    }
  }
}
