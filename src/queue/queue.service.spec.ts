import { Test, TestingModule } from '@nestjs/testing';
import { QueueService } from './queue.service';
import { NotFoundException } from '@nestjs/common';
import { Redis } from 'ioredis';

describe('QueueService', () => {
  let service: QueueService;

  const mockQueue = {
    add: jest.fn(),
    getJobCounts: jest.fn(),
    isPaused: jest.fn(),
    getJobs: jest.fn(),
    getJob: jest.fn(),
    close: jest.fn(),
  };

  // Mock para Redis
  const mockRedis = {
    // Adicione métodos do Redis que você usa, se necessário
    // Por exemplo:
    set: jest.fn().mockResolvedValue('OK'),
    get: jest.fn().mockResolvedValue(null),
    del: jest.fn().mockResolvedValue(1),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QueueService,
        {
          provide: Redis,
          useValue: mockRedis,
        },
      ],
    }).compile();

    service = module.get<QueueService>(QueueService);
    service['queues'].set('attendant-queue-1', mockQueue as any);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createQueue', () => {
    it('should create a new queue if it does not exist', async () => {
      const createQueueDto = { name: 'attendant-queue-2' };

      const result = await service.createQueue(createQueueDto);

      expect(result.name).toEqual('attendant-queue-2');
      expect(result.paused).toBe(false);
    });

    it('should return existing queue info if it already exists', async () => {
      const createQueueDto = { name: 'attendant-queue-1' };
      mockQueue.getJobCounts.mockResolvedValue({ completed: 1 });
      mockQueue.isPaused.mockResolvedValue(false);

      const result = await service.createQueue(createQueueDto);

      expect(result.name).toEqual('attendant-queue-1');
      expect(result.ticketCount).toEqual({ completed: 1 });
    });
  });

  describe('getQueue', () => {
    it('should throw NotFoundException if queue does not exist', async () => {
      await expect(service.getQueue('nonexistent-queue')).rejects.toThrow(
        new NotFoundException(
          'Queue for attendant nonexistent-queue not found.',
        ),
      );
    });

    it('should return queue info if it exists', async () => {
      mockQueue.getJobCounts.mockResolvedValue({ completed: 1 });
      mockQueue.isPaused.mockResolvedValue(false);

      const result = await service.getQueue('attendant-queue-1');

      expect(result.name).toEqual('attendant-queue-1');
      expect(result.ticketCount).toEqual({ completed: 1 });
    });
  });

  describe('listQueues', () => {
    it('should return all queues', async () => {
      mockQueue.getJobCounts.mockResolvedValue({ completed: 1 });
      mockQueue.isPaused.mockResolvedValue(false);

      const result = await service.listQueues();

      expect(result).toHaveLength(1);
      expect(result[0].name).toEqual('attendant-queue-1');
    });
  });

  describe('addJob', () => {
    it('should add a job to the queue', async () => {
      mockQueue.add.mockResolvedValue({ id: 'job1' });

      const result = await service.addJob('attendant-queue-1', {
        data: 'test',
      });

      expect(result).toEqual('job1');
      expect(mockQueue.add).toHaveBeenCalledWith('process-job', {
        data: 'test',
      });
    });

    it('should throw NotFoundException if queue does not exist', async () => {
      await expect(
        service.addJob('nonexistent-queue', { data: 'test' }),
      ).rejects.toThrow(
        new NotFoundException(
          'Queue for attendant nonexistent-queue not found.',
        ),
      );
    });
  });

  describe('removeJob', () => {
    it('should remove a job from the queue', async () => {
      const mockJob = { remove: jest.fn() };
      mockQueue.getJob.mockResolvedValue(mockJob);

      await service.removeJob('attendant-queue-1', 'job1');

      expect(mockJob.remove).toHaveBeenCalled();
    });

    it('should throw NotFoundException if job does not exist', async () => {
      mockQueue.getJob.mockResolvedValue(null);

      await expect(
        service.removeJob('attendant-queue-1', 'job1'),
      ).rejects.toThrow(new NotFoundException('Job with ID job1 not found.'));
    });
  });
});
