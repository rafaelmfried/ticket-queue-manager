import { Test, TestingModule } from '@nestjs/testing';
import { WorkersService } from './workers.service';
import { QueueService } from 'src/queue/queue.service';
import { TicketsService } from 'src/tickets/tickets.service';
import { Job, Queue, Worker } from 'bullmq';
import { QueueInfoDto } from 'src/queue/dto/queue-info.dto';

const mockQueueInfoDto: QueueInfoDto = {
  name: 'mockQueueName',
  paused: false,
  ticketCount: {},
};

const mockProcessingQueue = {
  getJob: jest.fn().mockResolvedValue({
    moveToCompleted: jest.fn().mockResolvedValue(undefined),
    token: 'mockToken',
  }),
} as unknown as Queue<any, any, string>; // Casting para Queue

describe('WorkersService', () => {
  let workersService: WorkersService;
  let queueService: QueueService;
  let ticketsService: TicketsService;

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

    jest.spyOn(queueService, 'getQueue').mockResolvedValue({
      queue: mockProcessingQueue,
      ...mockQueueInfoDto,
    });

    workersService = module.get<WorkersService>(WorkersService);
    queueService = module.get<QueueService>(QueueService);
    ticketsService = module.get<TicketsService>(TicketsService);
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
      workersService['workers'].set('worker2', {
        close: mockWorkerClose,
      } as any); // Adicionando um trabalhador extra para garantir cobertura total

      await workersService.onModuleDestroy();
      expect(mockWorkerClose).toHaveBeenCalledTimes(2); // Verificando se close foi chamado para ambos
    });
  });

  describe('initializeGeneralWorker', () => {
    it('should initialize the general worker and listen to events', async () => {
      const mockOn = jest.fn();
      jest.spyOn(Worker.prototype, 'on').mockImplementation(mockOn);

      await (workersService as any).initializeGeneralWorker();

      expect(mockOn).toHaveBeenCalledWith('completed', expect.any(Function));
      expect(mockOn).toHaveBeenCalledWith('failed', expect.any(Function));
      expect(mockOn).toHaveBeenCalledWith('progress', expect.any(Function)); // Adicionando a verificação de progress
      expect(mockOn).toHaveBeenCalledWith('stalled', expect.any(Function)); // Adicionando a verificação de stalled
    });
  });

  describe('handleGeneralWorkerJob', () => {
    it('should move job to processing queue and update ticket status', async () => {
      const mockJob = { data: { attendantId: 'att1', ticketId: 't1' } } as Job;
      const mockGetQueue = jest.fn().mockResolvedValue({ add: jest.fn() });
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
      const mockJob = { id: 'job1', data: { ticketId: 't1' } } as Job;
      const mockQueue = {
        getJobs: jest.fn().mockResolvedValue([mockJob]),
        add: jest.fn(),
      } as unknown as Queue<any, any, string>;

      const mockQueueInfo: QueueInfoDto = {
        name: 'attendant-queue-att1',
        ticketCount: { waiting: 1, active: 0, completed: 0, failed: 0 },
        paused: false,
        queue: mockQueue,
      };

      jest.spyOn(queueService, 'getQueue').mockResolvedValue(mockQueueInfo);

      const mockUpdateTicketStatus = jest.spyOn(
        workersService as any,
        'updateTicketStatus',
      );

      await workersService.processNextTicket('att1');

      expect(mockQueue.getJobs).toHaveBeenCalledWith(['waiting']);
      expect(mockQueue.add).toHaveBeenCalled();
      expect(mockUpdateTicketStatus).toHaveBeenCalledWith('t1', {
        status: 'PROCESSING',
      });
    });

    it('should handle no jobs available in the queue', async () => {
      const mockQueue = {
        getJobs: jest.fn().mockResolvedValue([]),
      } as unknown as Queue<any, any, string>;

      const mockQueueInfo: QueueInfoDto = {
        name: 'attendant-queue-att1',
        ticketCount: { waiting: 0, active: 0, completed: 0, failed: 0 },
        paused: false,
        queue: mockQueue,
      };

      jest.spyOn(queueService, 'getQueue').mockResolvedValue(mockQueueInfo);

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      await workersService.processNextTicket('att1');

      expect(consoleSpy).toHaveBeenCalledWith(
        'No jobs available for processing.',
      );
    });

    it('should handle queue paused state', async () => {
      const mockQueue = {
        getJobs: jest.fn().mockResolvedValue([]),
        isPaused: jest.fn().mockResolvedValue(true),
      } as unknown as Queue<any, any, string>;

      const mockQueueInfo: QueueInfoDto = {
        name: 'attendant-queue-att1',
        ticketCount: { waiting: 0, active: 0, completed: 0, failed: 0 },
        paused: true,
        queue: mockQueue,
      };

      jest.spyOn(queueService, 'getQueue').mockResolvedValue(mockQueueInfo);

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      await workersService.processNextTicket('att1');

      expect(consoleSpy).toHaveBeenCalledWith('Queue is paused.');
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
      const mockFinalizeTicket = jest
        .spyOn(workersService, 'finalizeTicket')
        .mockRejectedValue(new Error('Error'));

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      await (workersService as any).handleJobCompletion(mockJob);

      expect(mockFinalizeTicket).toHaveBeenCalledWith('att1', 't1');
      expect(consoleSpy).toHaveBeenCalledWith(
        'Error finalizing ticket t1:',
        expect.any(Error),
      );
    });
  });

  describe('handleJobFailure', () => {
    it('should log error when job fails', async () => {
      const mockJob = { id: 'job1' } as Job;
      const mockError = new Error('Test error');
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      await (workersService as any).handleJobFailure(mockJob, mockError);

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Job job1 failed with error:',
        mockError,
      );
    });
  });

  describe('finalizeTicket', () => {
    it('should finalize ticket and update status to CLOSED', async () => {
      const mockQueueName = 'att1';
      const mockTicketId = 't1';

      jest.spyOn(queueService, 'getQueue').mockResolvedValue({
        queue: mockProcessingQueue,
        ...mockQueueInfoDto,
      });

      const mockUpdateTicket = jest
        .spyOn(ticketsService, 'update')
        .mockResolvedValue(undefined);
      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();

      await workersService.finalizeTicket(mockQueueName, mockTicketId);

      expect(mockProcessingQueue.getJob).toHaveBeenCalledWith(mockTicketId);
      const job = await mockProcessingQueue.getJob(mockTicketId); // Aguarda a promessa
      expect(job.moveToCompleted).toHaveBeenCalledWith(
        `Ticket ${mockTicketId} completed`,
        'mockToken',
      );
      expect(mockUpdateTicket).toHaveBeenCalledWith(mockTicketId, {
        status: 'CLOSED',
      });
      expect(consoleLogSpy).toHaveBeenCalledWith(
        `Ticket ${mockTicketId} moved to completed for attendant ${mockQueueName}.`,
      );
    });

    it('should throw an error if the ticket is not found in processing queue', async () => {
      const mockQueueName = 'att1';
      const mockTicketId = 't1';
      jest.spyOn(queueService, 'getQueue').mockResolvedValue({
        queue: {
          getJob: jest.fn().mockResolvedValue(null),
        } as unknown as Queue<any, any, string>, // Casting para Queue
        ...mockQueueInfoDto,
      });

      await expect(
        workersService.finalizeTicket(mockQueueName, mockTicketId),
      ).rejects.toThrow('Ticket not found in processing queue.');
    });
  });

  describe('changeAttendantQueueStatus', () => {
    it('should create queue if status is OPEN', async () => {
      const mockQueueName = 'att1';
      const mockCreateQueue = jest
        .spyOn(workersService as any, 'createQueueForAttendant')
        .mockResolvedValue(undefined);
      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();

      await workersService.changeAttendantQueueStatus(mockQueueName, 'OPEN');

      expect(mockCreateQueue).toHaveBeenCalledWith(mockQueueName);
      expect(consoleLogSpy).toHaveBeenCalledWith(
        `Status da fila do atendente ${mockQueueName} alterado para OPEN`,
      );
    });

    it('should remove queue if status is CLOSED', async () => {
      const mockQueueName = 'att1';
      const mockRemoveQueue = jest
        .spyOn(queueService, 'removeQueue')
        .mockResolvedValue(undefined);
      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();

      await workersService.changeAttendantQueueStatus(mockQueueName, 'CLOSED');

      expect(mockRemoveQueue).toHaveBeenCalledWith(mockQueueName);
      expect(consoleLogSpy).toHaveBeenCalledWith(
        `Status da fila do atendente ${mockQueueName} alterado para CLOSED`,
      );
    });
  });

  describe('createQueueForAttendant', () => {
    it('should create a new queue if it does not exist', async () => {
      const mockQueueName = 'att1';
      const mockQueue = {
        queue: null,
        paused: null,
        ticketCount: null,
      } as QueueInfoDto; // Simula que a fila não existe
      jest.spyOn(queueService, 'getQueue').mockResolvedValue(mockQueue);
      const mockCreateQueue = jest
        .spyOn(queueService, 'createQueue')
        .mockResolvedValue(undefined);
      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();

      await (workersService as any).createQueueForAttendant(mockQueueName);

      expect(mockCreateQueue).toHaveBeenCalledWith({
        name: `attendant-queue-${mockQueueName}`,
      });
      expect(consoleLogSpy).toHaveBeenCalledWith(
        `Fila criada para o atendente ${mockQueueName}.`,
      );
    });

    it('should not create a queue if it already exists', async () => {
      const mockQueueName = 'att1';
      const mockQueue = {
        queue: {},
        paused: false,
        ticketCount: {},
      } as QueueInfoDto; // Simula que a fila já existe
      jest.spyOn(queueService, 'getQueue').mockResolvedValue(mockQueue);
      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();

      await (workersService as any).createQueueForAttendant(mockQueueName);

      expect(queueService.createQueue).not.toHaveBeenCalled();
      expect(consoleLogSpy).toHaveBeenCalledWith(
        `Fila para atendente ${mockQueueName} já existe.`,
      );
    });
  });
});
