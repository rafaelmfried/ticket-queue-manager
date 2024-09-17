import { Test, TestingModule } from '@nestjs/testing';
import { QueueController } from './queue.controller';
import { QueueService } from './queue.service';
import { CreateQueueDto } from './dto/create-queue.dto';
import { NotFoundException } from '@nestjs/common';
import { JobStatusDto } from './dto/jobs-info.dto';
import { Job } from 'bullmq';

describe('QueueController', () => {
  let controller: QueueController;
  let service: QueueService;

  const mockJob: Partial<Job<any, any, string>> = {
    id: 'job1',
    data: { test: 'data' },
    // Adicione outras propriedades e métodos necessários aqui se você precisar
  };

  const mockJobResponse = {
    jobs: [mockJob as unknown as Job, mockJob as unknown as Job],
  };

  const mockQueueService = {
    listQueues: jest.fn(),
    createQueue: jest.fn(),
    getQueue: jest.fn(),
    addJob: jest.fn(),
    getJobs: jest.fn(),
    removeJob: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [QueueController],
      providers: [{ provide: QueueService, useValue: mockQueueService }],
    }).compile();

    controller = module.get<QueueController>(QueueController);
    service = module.get<QueueService>(QueueService);
  });

  describe('listQueues', () => {
    it('should return all queues', async () => {
      const queues = [{ name: 'attendant-queue-1' }];
      mockQueueService.listQueues.mockResolvedValue(queues);

      expect(await controller.listQueues()).toEqual(queues);
    });
  });

  describe('createQueue', () => {
    it('should create a new queue', async () => {
      const createQueueDto: CreateQueueDto = { name: 'attendant-queue-2' };
      const queue = { name: 'attendant-queue-2' };
      mockQueueService.createQueue.mockResolvedValue(queue);

      expect(await controller.createQueue(createQueueDto)).toEqual(queue);
      expect(service.createQueue).toHaveBeenCalledWith(createQueueDto);
    });
  });

  describe('getQueue', () => {
    it('should return queue info for a given attendantId', async () => {
      const queue = { name: 'attendant-queue-1' };
      mockQueueService.getQueue.mockResolvedValue(queue);

      const result = await controller.getQueue('1');
      expect(result.name).toEqual('attendant-queue-1');
    });
  });

  describe('addJob', () => {
    it('should add a job to a queue', async () => {
      const jobData = { data: 'test' };
      mockQueueService.addJob.mockResolvedValue('job1');

      expect(await controller.addJob('1', jobData)).toEqual('job1');
      expect(service.addJob).toHaveBeenCalledWith('attendant-queue-1', jobData);
    });
  });

  describe('removeJob', () => {
    it('should remove a job from a queue', async () => {
      mockQueueService.removeJob.mockResolvedValue({ success: true });

      expect(await controller.removeJob('1', 'job1')).toEqual({
        success: true,
      });
    });
  });

  describe('getJobs', () => {
    it('deve retornar os jobs da fila corretamente', async () => {
      const attendantId = '123';
      const queueName = `attendant-queue-${attendantId}`;
      const jobStatusDto: JobStatusDto = { status: ['completed'] };

      // Mockando o retorno do serviço
      jest.spyOn(service, 'getJobs').mockResolvedValue(mockJobResponse);

      const result = await controller.getJobs(attendantId, jobStatusDto);

      // Verificar se o método do serviço foi chamado com o nome correto da fila e JobStatusDto
      expect(service.getJobs).toHaveBeenCalledWith(queueName, jobStatusDto);

      // Verificar se a resposta do controlador está correta
      expect(result).toEqual(mockJobResponse);
    });

    it('deve lançar NotFoundException se a fila não for encontrada', async () => {
      const attendantId = '123';
      const queueName = `attendant-queue-${attendantId}`;
      const jobStatusDto: JobStatusDto = { status: ['completed'] };

      // Mock para lançar a exceção NotFoundException
      jest
        .spyOn(service, 'getJobs')
        .mockRejectedValue(
          new NotFoundException(`Queue for attendant ${queueName} not found.`),
        );

      await expect(
        controller.getJobs(attendantId, jobStatusDto),
      ).rejects.toThrow(
        new NotFoundException(`Queue for attendant ${queueName} not found.`),
      );
    });
  });
});
