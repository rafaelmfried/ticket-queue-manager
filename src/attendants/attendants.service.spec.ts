import { Test, TestingModule } from '@nestjs/testing';
import { AttendantsService } from './attendants.service';
import { PrismaService } from 'prisma/prisma.service';
import { WorkersService } from 'src/workers/workers.service';
import { Prisma, Attendant, QueueStatus, Role } from '@prisma/client';
import { CreateAttendantDto } from './dto/create-attendant.dto';

describe('AttendantsService', () => {
  let service: AttendantsService;
  let prisma: PrismaService;
  let workersService: WorkersService;

  const mockPrismaService = {
    attendant: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };

  const mockWorkersService = {
    changeAttendantQueueStatus: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AttendantsService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: WorkersService, useValue: mockWorkersService },
      ],
    }).compile();

    service = module.get<AttendantsService>(AttendantsService);
    prisma = module.get<PrismaService>(PrismaService);
    workersService = module.get<WorkersService>(WorkersService);
  });

  // Testes para o método `create`
  describe('create', () => {
    it('should create a new attendant', async () => {
      const createAttendantDto: CreateAttendantDto = {
        name: 'John Doe',
        email: 'john.doe@example.com',
        password: 'password',
        roles: [Role.ATTENDANT],
        queueStatus: QueueStatus.OPEN,
        queueLimit: 5,
        serviceIds: ['1', '2'],
      };

      const newAttendant: Attendant = {
        id: '1',
        ...createAttendantDto,
      };

      jest.spyOn(prisma.attendant, 'create').mockResolvedValue(newAttendant);

      expect(await service.create(createAttendantDto)).toEqual(newAttendant);
    });
  });

  // Testes para o método `findAll`
  describe('findAll', () => {
    it('should return an array of attendants', async () => {
      const attendants: Attendant[] = [
        {
          id: '1',
          name: 'John Doe',
          email: 'john.doe@example.com',
          password: 'password',
          queueStatus: QueueStatus.OPEN,
          queueLimit: 5,
          roles: [Role.ATTENDANT],
        },
      ];

      jest.spyOn(prisma.attendant, 'findMany').mockResolvedValue(attendants);

      expect(await service.findAll()).toEqual(attendants);
    });
  });

  // Testes para o método `changeQueueStatus`
  describe('changeQueueStatus', () => {
    it('should change the queue status of an attendant', async () => {
      const attendantId = '1';
      const status: 'OPEN' | 'CLOSED' = 'CLOSED';
      const updatedAttendant: Attendant = {
        id: attendantId,
        name: 'John Doe',
        email: 'john.doe@example.com',
        password: 'password',
        queueStatus: status,
        queueLimit: 5,
        roles: [Role.ATTENDANT],
      };

      jest
        .spyOn(prisma.attendant, 'update')
        .mockResolvedValue(updatedAttendant);
      jest
        .spyOn(workersService, 'changeAttendantQueueStatus')
        .mockResolvedValue();

      expect(await service.changeQueueStatus(attendantId, status)).toEqual(
        updatedAttendant,
      );
      expect(workersService.changeAttendantQueueStatus).toHaveBeenCalledWith(
        `attendant-queue-${attendantId}`,
        status,
      );
    });
  });

  // Testes para o método `findOne`
  describe('findOne', () => {
    it('should return an attendant by id', async () => {
      const attendantId = '1';
      const attendant: Attendant = {
        id: attendantId,
        name: 'John Doe',
        email: 'john.doe@example.com',
        password: 'password',
        queueStatus: QueueStatus.OPEN,
        queueLimit: 5,
        roles: [Role.ATTENDANT],
      };

      jest.spyOn(prisma.attendant, 'findUnique').mockResolvedValue(attendant);

      expect(await service.findOne(attendantId)).toEqual(attendant);
    });
  });

  // Testes para o método `update`
  describe('update', () => {
    it('should update an attendant', async () => {
      const updateData: Prisma.AttendantUpdateInput = {
        name: 'Jane Doe',
        services: { set: [{ id: 'service1' }] },
      };

      const updatedAttendant: Attendant = {
        id: '1',
        name: 'Jane Doe',
        email: 'john.doe@example.com',
        password: 'password',
        queueStatus: 'OPEN',
        queueLimit: 10,
        roles: [],
      };

      jest
        .spyOn(prisma.attendant, 'update')
        .mockResolvedValue(updatedAttendant);

      const result = await service.update('1', updateData);
      expect(result).toEqual(updatedAttendant);
      expect(prisma.attendant.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: {
          ...updateData,
          services: { set: [{ id: 'service1' }] },
        },
        include: { services: true },
      });
    });
  });

  // Testes para o método `remove`
  describe('remove', () => {
    it('should remove an attendant by id', async () => {
      const attendantId = '1';
      const removedAttendant: Attendant = {
        id: attendantId,
        name: 'John Doe',
        email: 'john.doe@example.com',
        password: 'password',
        queueStatus: QueueStatus.OPEN,
        queueLimit: 5,
        roles: [Role.ATTENDANT],
      };

      jest
        .spyOn(prisma.attendant, 'delete')
        .mockResolvedValue(removedAttendant);

      expect(await service.remove(attendantId)).toEqual(removedAttendant);
    });
  });
});
