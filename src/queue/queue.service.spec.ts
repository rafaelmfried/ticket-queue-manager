import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { QueueService } from './queue.service';
import { Job, Queue } from 'bullmq';
import { CreateQueueDto } from './dto/create-queue.dto';
import { JobStatusDto } from './dto/jobs-info.dto';
import { QueueInfoDto } from './dto/queue-info.dto';

jest.mock('bullmq');

describe('QueueService', () => {
  let service: QueueService;
  let queueMock: jest.Mocked<Queue>;

  beforeAll(() => {
    // jest.spyOn(console, 'log').mockImplementation(() => {}); // Moca console.log
  });

  afterAll(() => {
    jest.restoreAllMocks(); // Restaura comportamento original
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [QueueService],
    }).compile();

    service = module.get<QueueService>(QueueService);

    // Mock do Queue do BullMQ
    queueMock = {
      name: 'test-queue',
      getJobCounts: jest.fn().mockResolvedValue({ waiting: 1, active: 1 }),
      isPaused: jest.fn().mockResolvedValue(false),
      add: jest.fn().mockResolvedValue({ id: 'job-id' }),
      getJobs: jest.fn().mockResolvedValue([{ id: 'job1' }, { id: 'job2' }]),
      getJob: jest.fn().mockResolvedValue({
        remove: jest.fn().mockResolvedValue(null),
      }),
      close: jest.fn().mockResolvedValue(null),
    } as unknown as jest.Mocked<Queue>;

    // Substituir o Map no QueueService para retornar nosso mock
    service['queues'] = new Map<string, Queue>();

    // Mock da implementação do Queue para retornar nosso mock quando instanciado
    (Queue as unknown as jest.Mock).mockImplementation((name: string) => {
      return {
        ...queueMock,
        name,
      };
    });
  });

  afterEach(() => {
    service['queues'].clear();
    jest.clearAllMocks();
  });

  describe('createQueue', () => {
    it('deve criar uma fila com sucesso e retornar QueueInfoDto', async () => {
      const createQueueDto: CreateQueueDto = { name: 'queue1' };
      const result: QueueInfoDto = await service.createQueue(createQueueDto);

      // Verificação de todas as propriedades do QueueInfoDto
      expect(result).toEqual({
        name: 'queue1',
        queue: expect.anything(), // Verifica que existe um objeto queue
        ticketCount: { waiting: 1, active: 1 }, // Verifica ticketCount
        paused: false, // Verifica se a fila está pausada
      });

      // Verificar se o método getJobCounts foi chamado
      expect(queueMock.getJobCounts).toHaveBeenCalled();
    });

    it('não deve criar uma fila se ela já existir e retornar QueueInfoDto', async () => {
      const createQueueDto: CreateQueueDto = { name: 'queue1' };
      await service.createQueue(createQueueDto); // Criação inicial
      const result: QueueInfoDto = await service.createQueue(createQueueDto); // Segunda tentativa

      // Verificação de todas as propriedades do QueueInfoDto
      expect(result).toEqual({
        name: 'queue1',
        queue: expect.anything(),
        ticketCount: { waiting: 1, active: 1 },
        paused: false,
      });

      // Verifica se as chamadas necessárias foram feitas
      expect(queueMock.getJobCounts).toHaveBeenCalledTimes(2);
    });
  });

  describe('getQueue', () => {
    it('deve retornar uma fila existente e retornar QueueInfoDto', async () => {
      await service.createQueue({ name: 'queue1' });
      const result: QueueInfoDto = await service.getQueue('queue1');

      // Verificação de todas as propriedades do QueueInfoDto
      expect(result).toMatchObject({
        name: 'queue1',
        ticketCount: { waiting: 1, active: 1 },
        paused: false,
      });
    });

    it('deve lançar exceção ao tentar acessar uma fila inexistente', async () => {
      await expect(service.getQueue('queue-not-exist')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('listQueues', () => {
    it('deve listar todas as filas e retornar uma lista de QueueInfoDto', async () => {
      await service.createQueue({ name: 'queue1' });
      await service.createQueue({ name: 'queue2' });

      // Adicione um log para verificar o estado das filas
      console.log(
        'Estado do Map antes do listQueues:',
        Array.from(service['queues'].keys()),
      );

      const result: QueueInfoDto[] = await service.listQueues();

      // Adicione um log para verificar o resultado do método listQueues
      console.log('Resultado do listQueues:', result);

      expect(result.length).toBe(2);

      // Verificar se ambos os objetos de QueueInfoDto estão corretos
      expect(result[0]).toEqual({
        name: 'queue1',
        ticketCount: { waiting: 1, active: 1 },
        paused: false,
      });

      expect(result[1]).toEqual({
        name: 'queue2',
        ticketCount: { waiting: 1, active: 1 },
        paused: false,
      });
    });
  });

  describe('addJob', () => {
    it('deve adicionar um job a uma fila existente e retornar o ID do job', async () => {
      await service.createQueue({ name: 'queue1' });
      const result = await service.addJob('queue1', { data: 'job-data' });

      expect(result).toBe('job-id');
      expect(queueMock.add).toHaveBeenCalledWith('process-job', {
        data: 'job-data',
      });
    });

    it('deve lançar exceção ao adicionar um job em uma fila inexistente', async () => {
      await expect(
        service.addJob('queue-not-exist', { data: 'job-data' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('getJobs', () => {
    it('deve recuperar jobs de uma fila e retornar uma lista de jobs', async () => {
      await service.createQueue({ name: 'queue1' });
      const jobStatusDto: JobStatusDto = { status: ['waiting'] };
      const result = await service.getJobs('queue1', jobStatusDto);

      expect(result.jobs.length).toBe(2);
      expect(result.jobs[0].id).toBe('job1');
      expect(result.jobs[1].id).toBe('job2');
    });

    it('deve lançar exceção ao tentar recuperar jobs de uma fila inexistente', async () => {
      const jobStatusDto: JobStatusDto = { status: ['waiting'] };
      await expect(
        service.getJobs('queue-not-exist', jobStatusDto),
      ).rejects.toThrow(NotFoundException);
    });

    it('deve retornar os jobs com o status fornecido', async () => {
      // Criar uma fila e adicionar jobs
      await service.createQueue({ name: 'queue1' });

      // Mock do método `getJobs` da fila
      const queue = service['queues'].get('queue1');
      const mockJobs = [
        { id: 'job1', status: 'completed' } as unknown as Job,
        { id: 'job2', status: 'waiting' } as unknown as Job,
      ];

      jest.spyOn(queue, 'getJobs').mockResolvedValue(mockJobs); // Moca a resposta do método `getJobs`

      const jobStatusDto: JobStatusDto = { status: ['waiting'] };

      // Chama o método `getJobs`
      const result = await service.getJobs('queue1', jobStatusDto);

      // Verifica se a resposta contém os jobs com o status correto
      expect(result.jobs).toEqual(mockJobs);
      expect(queue.getJobs).toHaveBeenCalledWith(['waiting']); // Verifica se foi chamado corretamente com o status fornecido
    });

    it('deve lançar NotFoundException se a fila não existir', async () => {
      const jobStatusDto: JobStatusDto = { status: ['waiting'] };

      // Verifica se a exceção é lançada corretamente
      await expect(service.getJobs('queue2', jobStatusDto)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('removeJob', () => {
    it('deve remover um job existente e retornar sucesso', async () => {
      await service.createQueue({ name: 'queue1' });
      await service.addJob('queue1', { data: 'job-data' });
      const result = await service.removeJob('queue1', 'job-id');

      expect(result).toEqual({ success: true });
      expect(queueMock.getJob).toHaveBeenCalledWith('job-id');
    });

    it('deve lançar exceção ao tentar remover um job inexistente', async () => {
      queueMock.getJob = jest.fn().mockResolvedValue(null); // Simular que o job não existe
      await service.createQueue({ name: 'queue1' });

      await expect(
        service.removeJob('queue1', 'job-not-found'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('removeQueue', () => {
    it('deve remover uma fila existente e fechar a fila', async () => {
      await service.createQueue({ name: 'queue1' });
      await service.removeQueue('queue1');

      expect(queueMock.close).toHaveBeenCalled();
      expect(service['queues'].has('queue1')).toBe(false); // Verifica se foi removida do Map
    });

    it('deve apenas logar se tentar remover uma fila inexistente', async () => {
      const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
      await service.removeQueue('queue-not-exist');
      expect(logSpy).toHaveBeenCalledWith(
        'Fila queue-not-exist não encontrada.',
      );
    });

    it('deve lançar NotFoundException se a fila não existir', async () => {
      const queueName = 'nonExistingQueue';
      const jobId = 'job1';

      // Verifica se a exceção NotFoundException é lançada ao tentar remover um job de uma fila inexistente
      await expect(service.removeJob(queueName, jobId)).rejects.toThrow(
        new NotFoundException(`Queue for attendant ${queueName} not found.`),
      );
    });
  });
});
