import { Test, TestingModule } from '@nestjs/testing';
import { AttendantsController } from './attendants.controller';
import { AttendantsService } from './attendants.service';
import { WorkersService } from 'src/workers/workers.service';
import { CreateAttendantDto } from './dto/create-attendant.dto';
import { UpdateAttendantDto } from './dto/update-attendant.dto';

describe('AttendantsController', () => {
  let controller: AttendantsController;
  let attendantService: AttendantsService;
  let workersService: WorkersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AttendantsController],
      providers: [
        {
          provide: AttendantsService,
          useValue: {
            create: jest
              .fn()
              .mockResolvedValue({ id: '1', name: 'Test Attendant' }),
            findAll: jest.fn().mockResolvedValue([]),
            findOne: jest
              .fn()
              .mockResolvedValue({ id: '1', name: 'Test Attendant' }),
            update: jest
              .fn()
              .mockResolvedValue({ id: '1', name: 'Updated Attendant' }),
            remove: jest.fn().mockResolvedValue({}),
            changeQueueStatus: jest
              .fn()
              .mockResolvedValue({ id: '1', queueStatus: 'OPEN' }),
          },
        },
        {
          provide: WorkersService,
          useValue: {
            processNextTicket: jest.fn().mockResolvedValue(undefined),
            finalizeTicket: jest.fn().mockResolvedValue(undefined),
          },
        },
      ],
    }).compile();

    controller = module.get<AttendantsController>(AttendantsController);
    attendantService = module.get<AttendantsService>(AttendantsService);
    workersService = module.get<WorkersService>(WorkersService);
  });

  describe('changeQueueStatus', () => {
    it('should change the queue status of an attendant', async () => {
      const result = await controller.changeQueueStatus('1', 'OPEN');
      expect(result).toEqual({
        message: 'Status da fila alterado para OPEN',
        attendant: { id: '1', queueStatus: 'OPEN' },
      });
      expect(attendantService.changeQueueStatus).toHaveBeenCalledWith(
        '1',
        'OPEN',
      );
    });
  });

  describe('processNextTicket', () => {
    it('should process the next ticket for an attendant', async () => {
      const result = await controller.processNextTicket('1');
      expect(result).toEqual({
        message: 'Próximo ticket processado para o atendente 1',
      });
      expect(workersService.processNextTicket).toHaveBeenCalledWith('1');
    });

    it('should handle errors while processing the next ticket', async () => {
      workersService.processNextTicket = jest
        .fn()
        .mockRejectedValue(new Error('Some error'));
      const result = await controller.processNextTicket('1');
      expect(result).toEqual({
        error: 'Erro ao processar próximo ticket: Some error',
      });
    });
  });

  describe('finalizeTicket', () => {
    it('should finalize a ticket for an attendant', async () => {
      const result = await controller.finalizeTicket('1', '2');
      expect(result).toEqual({
        message: 'Ticket 2 finalizado para o atendente 1',
      });
      expect(workersService.finalizeTicket).toHaveBeenCalledWith('1', '2');
    });

    it('should handle errors while finalizing a ticket', async () => {
      workersService.finalizeTicket = jest
        .fn()
        .mockRejectedValue(new Error('Some error'));
      const result = await controller.finalizeTicket('1', '2');
      expect(result).toEqual({
        error: 'Erro ao finalizar o ticket: Some error',
      });
    });
  });

  describe('create', () => {
    it('should create an attendant', async () => {
      const createAttendantDto: CreateAttendantDto = {
        name: 'Test Attendant',
        email: 'test@example.com',
        password: 'password',
        roles: ['USER'],
        queueStatus: 'OPEN',
        queueLimit: 10,
        serviceIds: ['1'],
      };
      const result = await controller.create(createAttendantDto);
      jest.spyOn(attendantService, 'create').mockResolvedValue(result);
      expect(result).toEqual({
        id: '1',
        name: 'Test Attendant',
      });
      expect(attendantService.create).toHaveBeenCalledWith(createAttendantDto);
    });
  });

  describe('findAll', () => {
    it('should return an array of attendants', async () => {
      const result = await controller.findAll();
      expect(result).toEqual([]);
      expect(attendantService.findAll).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return a single attendant by id', async () => {
      const result = await controller.findOne('1');
      expect(result).toEqual({ id: '1', name: 'Test Attendant' });
      expect(attendantService.findOne).toHaveBeenCalledWith('1');
    });
  });

  describe('update', () => {
    it('should update an attendant', async () => {
      const updateAttendantDto: UpdateAttendantDto = {
        name: 'Updated Attendant',
      };
      const result = await controller.update('1', updateAttendantDto);
      expect(result).toEqual({ id: '1', name: 'Updated Attendant' });
      expect(attendantService.update).toHaveBeenCalledWith(
        '1',
        updateAttendantDto,
      );
    });
  });

  describe('remove', () => {
    it('should remove an attendant', async () => {
      const result = await controller.remove('1');
      expect(result).toEqual({});
      expect(attendantService.remove).toHaveBeenCalledWith('1');
    });
  });
});
