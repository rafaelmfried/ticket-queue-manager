import { Test, TestingModule } from '@nestjs/testing';
import { TicketsService } from './tickets.service';
import { PrismaService } from 'prisma/prisma.service';
import { QueueService } from 'src/queue/queue.service';
import { NotFoundException } from '@nestjs/common';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { UpdateTicketDto } from './dto/update-ticket.dto';
import {
  Role,
  QueueStatus,
  TicketStatus,
  Ticket,
  Service,
} from '@prisma/client';
// import { Queue } from 'bullmq';
import { QueueInfoDto } from 'src/queue/dto/queue-info.dto'; // Certifique-se de importar o DTO correto

// // Mock do Queue
// const queue = {
//   name: 'attendant-queue-attendant1',
//   getJobCounts: jest.fn().mockResolvedValue({}),
//   isPaused: jest.fn().mockResolvedValue(false),
//   add: jest.fn().mockResolvedValue('job1'),
//   getJobs: jest.fn().mockResolvedValue([]),
//   getJob: jest.fn().mockResolvedValue(null),
//   close: jest.fn().mockResolvedValue(undefined),
// } as unknown as Queue<any, any, string>; // Forçando o tipo se necessário

const createTicketDto: CreateTicketDto = {
  serviceId: 'service1',
  attendantId: 'attendant1',
  clientId: 'client1',
  status: 'OPEN' as TicketStatus,
};

const ticket: Ticket = {
  id: 'ticket1',
  serviceId: 'service1',
  attendantId: 'attendant1',
  clientId: 'client1',
  status: 'OPEN' as TicketStatus,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const attendant = {
  id: 'attendant1',
  name: 'John Doe',
  email: 'john.doe@example.com',
  password: 'password123',
  roles: [Role.ATTENDANT],
  queueStatus: QueueStatus.OPEN,
  queueLimit: 10,
};

const mockService: Service = {
  id: 'service1',
  name: 'Service Name',
};

describe('TicketsService', () => {
  let service: TicketsService;
  let prisma: PrismaService;
  let queueService: QueueService;

  const mockPrismaService = {
    ticket: {
      create: jest.fn().mockResolvedValue(ticket),
      findUniqueOrThrow: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    attendant: { findUnique: jest.fn().mockResolvedValue(attendant) },
    service: { findUnique: jest.fn().mockResolvedValue(mockService) },
  };

  const mockQueueService = {
    getQueue: jest.fn().mockResolvedValue({
      name: 'attendant-queue-attendant1',
      paused: false,
      ticketCount: {},
    } as QueueInfoDto),
    addJob: jest.fn().mockResolvedValue('job1'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TicketsService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: QueueService, useValue: mockQueueService },
      ],
    }).compile();

    service = module.get<TicketsService>(TicketsService);
    prisma = module.get<PrismaService>(PrismaService);
    queueService = module.get<QueueService>(QueueService);
  });

  describe('create', () => {
    it('should create a new ticket and add to queue', async () => {
      jest.spyOn(prisma.attendant, 'findUnique').mockResolvedValue(attendant);
      jest.spyOn(prisma.service, 'findUnique').mockResolvedValue(mockService);
      jest.spyOn(prisma.ticket, 'create').mockResolvedValue(ticket);

      jest.spyOn(queueService, 'getQueue').mockResolvedValue({
        name: 'attendant-queue-attendant1',
        paused: false,
        ticketCount: {},
      } as QueueInfoDto);

      jest.spyOn(queueService, 'addJob').mockResolvedValue('job1');

      const result = await service.create(createTicketDto);
      expect(result).toEqual({
        ...ticket,
        attendant: attendant.name,
        service: mockService.name, // Ajustado para refletir a propriedade correta
        jobId: 'job1',
      });
    });

    it('should throw an error if queue is not open', async () => {
      jest
        .spyOn(queueService, 'getQueue')
        .mockRejectedValue(new Error('Queue is not OPEN'));

      await expect(service.create(createTicketDto)).rejects.toThrow(
        new Error('Queue is not OPEN Queue is not OPEN'),
      );
    });
  });

  describe('findTicket', () => {
    it('should return a ticket by id', async () => {
      const ticketId = 'ticket1';

      jest.spyOn(prisma.ticket, 'findUniqueOrThrow').mockResolvedValue(ticket);

      expect(await service.findTicket(ticketId)).toEqual(ticket);
    });

    it('should throw NotFoundException if ticket is not found', async () => {
      const ticketId = 'nonexistent';
      jest
        .spyOn(prisma.ticket, 'findUniqueOrThrow')
        .mockRejectedValue(new Error());

      await expect(service.findTicket(ticketId)).rejects.toThrow(
        new NotFoundException(`Ticket with ID ${ticketId} not found.`),
      );
    });
  });

  describe('findAll', () => {
    it('should return an array of tickets', async () => {
      jest.spyOn(prisma.ticket, 'findMany').mockResolvedValue([ticket]);

      expect(await service.findAll()).toEqual([ticket]);
    });
  });

  describe('update', () => {
    it('should update a ticket by id', async () => {
      const ticketId = 'ticket1';
      const updateData: UpdateTicketDto = { status: 'CLOSED' as TicketStatus };
      const updatedTicket: Ticket = {
        ...ticket,
        status: 'CLOSED' as TicketStatus,
      };

      jest.spyOn(prisma.ticket, 'update').mockResolvedValue(updatedTicket);

      expect(await service.update(ticketId, updateData)).toEqual(updatedTicket);
    });

    it('should throw NotFoundException if ticket is not found', async () => {
      const ticketId = 'nonexistent';
      jest.spyOn(prisma.ticket, 'update').mockRejectedValue(new Error());

      await expect(
        service.update(ticketId, { status: 'CLOSED' as TicketStatus }),
      ).rejects.toThrow(
        new NotFoundException(`Ticket with ID ${ticketId} not found.`),
      );
    });
  });

  describe('remove', () => {
    it('should remove a ticket by id', async () => {
      const ticketId = 'ticket1';

      jest.spyOn(prisma.ticket, 'delete').mockResolvedValue(ticket);

      expect(await service.remove(ticketId)).toEqual(ticket);
    });

    it('should throw NotFoundException if ticket is not found', async () => {
      const ticketId = 'nonexistent';
      jest.spyOn(prisma.ticket, 'delete').mockRejectedValue(new Error());

      await expect(service.remove(ticketId)).rejects.toThrow(
        new NotFoundException(`Ticket with ID ${ticketId} not found.`),
      );
    });
  });
});
