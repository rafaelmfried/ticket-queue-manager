import { Test, TestingModule } from '@nestjs/testing';
import { WorkersService } from './workers.service';
import { QueueService } from 'src/queue/queue.service';
import { TicketsService } from 'src/tickets/tickets.service';
import { Job, Queue, Worker } from 'bullmq';
import { QueueInfoDto } from 'src/queue/dto/queue-info.dto';

describe('WorkersService', () => {
  let workersService: WorkersService;
  let queueService: QueueService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WorkersService,
        {
          provide: QueueService,
          useValue: {
            getQueue: jest.fn(),
            createQueue: jest.fn(),
            removeQueue: jest.fn(),
          },
        },
        {
          provide: TicketsService,
          useValue: {
            update: jest.fn(),
          },
        },
      ],
    }).compile();

    workersService = module.get<WorkersService>(WorkersService);
    queueService = module.get<QueueService>(QueueService);
  });

  afterEach(async () => {
    jest.clearAllMocks();
  });

  describe('onModuleDestroy', () => {
    it('should close all workers', async () => {
      const mockWorkerClose = jest.fn();
      workersService['workers'].set('worker1', {
        close: mockWorkerClose,
      } as any);
      await workersService.onModuleDestroy();
      expect(mockWorkerClose).toHaveBeenCalled();
    });
  });

  describe('initializeGeneralWorker', () => {
    it('should initialize the general worker and listen to events', async () => {
      const mockOn = jest.fn();
      jest.spyOn(Worker.prototype, 'on').mockImplementation(mockOn);
      await (workersService as any).initializeGeneralWorker();
      expect(mockOn).toHaveBeenCalledWith('completed', expect.any(Function));
      expect(mockOn).toHaveBeenCalledWith('failed', expect.any(Function));
    });
  });

  describe('handleGeneralWorkerJob', () => {
    it('should move job to processing queue and update ticket status', async () => {
      const mockJob = { data: { attendantId: 'att1', ticketId: 't1' } } as Job;
      const mockGetQueue = jest
        .fn()
        .mockResolvedValue({ queue: { add: jest.fn() } });
      jest.spyOn(queueService, 'getQueue').mockImplementation(mockGetQueue);
      const mockUpdateTicketStatus = jest.spyOn(
        workersService as any,
        'updateTicketStatus',
      );

      await (workersService as any).handleGeneralWorkerJob(mockJob);
      expect(mockGetQueue).toHaveBeenCalledWith('att1');
      expect(mockUpdateTicketStatus).toHaveBeenCalledWith('t1', {
        status: 'PROCESSING',
      });
    });

    it('should handle errors when moving job to processing queue', async () => {
      const mockJob = { data: { attendantId: 'att1', ticketId: 't1' } } as Job;
      const mockGetQueue = jest.fn().mockRejectedValue(new Error('Error'));
      jest.spyOn(queueService, 'getQueue').mockImplementation(mockGetQueue);

      await expect(
        (workersService as any).handleGeneralWorkerJob(mockJob),
      ).rejects.toThrow('Error');
    });
  });

  describe('processNextTicket', () => {
    it('should process the next job in the queue', async () => {
      // Mock para o Job
      const mockJob = { id: 'job1', data: { ticketId: 't1' } } as Job;

      // Mock para o Queue com os métodos necessários
      const mockQueue = {
        getJobs: jest.fn().mockResolvedValue([mockJob]), // Retorna o job mockado
        add: jest.fn(), // Simula o add de job na fila
      } as unknown as Queue<any, any, string>; // Usa o casting para o tipo Queue

      // Mock para o QueueInfoDto com as propriedades esperadas
      const mockQueueInfo: QueueInfoDto = {
        name: 'attendant-queue-att1',
        ticketCount: { waiting: 1, active: 0, completed: 0, failed: 0 }, // Exemplo de contagens de jobs
        paused: false,
        queue: mockQueue,
      };

      // Mockando o getQueue para retornar o mock da fila
      jest.spyOn(queueService, 'getQueue').mockResolvedValue(mockQueueInfo);

      // Spy na função updateTicketStatus
      const mockUpdateTicketStatus = jest.spyOn(
        workersService as any,
        'updateTicketStatus',
      );

      // Chama o método processNextTicket
      await workersService.processNextTicket('att1');

      // Verifica se os métodos foram chamados corretamente
      expect(mockQueue.getJobs).toHaveBeenCalledWith(['waiting']); // Verifica se buscou os jobs
      expect(mockQueue.add).toHaveBeenCalled(); // Verifica se moveu para processing
      expect(mockUpdateTicketStatus).toHaveBeenCalledWith('t1', {
        status: 'PROCESSING',
      }); // Verifica se o status foi atualizado
    });

    it('should handle no jobs available in the queue', async () => {
      // Mockando a fila para retornar nenhum job
      const mockQueue = {
        getJobs: jest.fn().mockResolvedValue([]), // Nenhum job
      } as unknown as Queue<any, any, string>; // Casting para Queue

      // Mock para o QueueInfoDto com as propriedades esperadas
      const mockQueueInfo: QueueInfoDto = {
        name: 'attendant-queue-att1',
        ticketCount: { waiting: 0, active: 0, completed: 0, failed: 0 },
        paused: false,
        queue: mockQueue,
      };

      jest.spyOn(queueService, 'getQueue').mockResolvedValue(mockQueueInfo);

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      await workersService.processNextTicket('att1');

      // Verifica se a mensagem de "No jobs available" foi logada
      expect(consoleSpy).toHaveBeenCalledWith(
        'No jobs available for processing.',
      );
    });
  });

  describe('handleJobCompletion', () => {
    it('should finalize ticket on job completion', async () => {
      const mockJob = { data: { queueName: 'att1', ticketId: 't1' } } as Job;
      const mockFinalizeTicket = jest
        .spyOn(workersService, 'finalizeTicket')
        .mockResolvedValue(null);

      await (workersService as any).handleJobCompletion(mockJob);
      expect(mockFinalizeTicket).toHaveBeenCalledWith('att1', 't1');
    });

    it('should log error on job completion failure', async () => {
      const mockJob = { data: { queueName: 'att1', ticketId: 't1' } } as Job;
      // const mockFinalizeTicket = jest
      //   .spyOn(workersService, 'finalizeTicket')
      //   .mockRejectedValue(new Error('Error'));

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      await (workersService as any).handleJobCompletion(mockJob);
      expect(consoleSpy).toHaveBeenCalledWith(
        'Error finalizing ticket t1:',
        expect.any(Error),
      );
    });
  });
});
