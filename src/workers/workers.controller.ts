import { Controller, Post, Param, Get, Body, Patch } from '@nestjs/common';
import { WorkersService } from './workers.service';
import { QueueService } from '../queue/queue.service';

@Controller('workers')
export class WorkersController {
  constructor(
    private readonly workerService: WorkersService,
    private readonly queueService: QueueService,
  ) {}

  // Rota para criar uma nova fila e um worker associado a ela
  @Post(':queueName')
  async createQueue(@Param('queueName') queueName: string) {
    await this.queueService.createQueue({ name: queueName });
    await this.workerService.createWorker(queueName);
    return {
      success: true,
      message: `Queue and worker for ${queueName} created successfully`,
    };
  }

  // Rota para listar todas as filas
  @Get()
  async listQueues() {
    return this.queueService.listQueues();
  }

  // Rota para adicionar um job a uma fila específica
  @Post(':queueName/jobs')
  async addJobToQueue(
    @Param('queueName') queueName: string,
    @Body() jobData: any,
  ) {
    const jobId = await this.queueService.addJob(queueName, jobData);
    return { success: true, jobId };
  }

  // Rota para listar os jobs de uma fila específica
  @Get(':queueName/jobs')
  async getJobsFromQueue(
    @Param('queueName') queueName: string,
    @Body() jobStatusDto: any,
  ) {
    return this.queueService.getJobs(queueName, jobStatusDto);
  }

  // Rota para processar um job individual em uma fila específica
  @Post(':queueName/jobs/process')
  async processSingleJob(@Param('queueName') queueName: string) {
    return this.queueService.processSingleJob(queueName);
  }

  // Rota para atualizar a posição ou o status de um job em uma fila específica
  @Patch(':queueName/jobs/:jobId')
  async updateJobInQueue(
    @Param('queueName') queueName: string,
    @Param('jobId') jobId: string,
    @Body() updates: any,
  ) {
    return this.queueService.updateJob(queueName, jobId, updates);
  }

  // Rota para remover um job específico de uma fila
  @Post(':queueName/jobs/:jobId/remove')
  async removeJobFromQueue(
    @Param('queueName') queueName: string,
    @Param('jobId') jobId: string,
  ) {
    return this.queueService.removeJob(queueName, jobId);
  }
}
