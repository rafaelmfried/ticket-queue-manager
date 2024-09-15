import { Test, TestingModule } from '@nestjs/testing';
import { TicketsController } from './tickets.controller';
import { TicketsService } from './tickets.service';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { UpdateTicketDto } from './dto/update-ticket.dto';
import { TicketStatus } from '@prisma/client';

describe('TicketsController', () => {
  let controller: TicketsController;
  let service: TicketsService;

  const mockTicketsService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findTicket: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TicketsController],
      providers: [{ provide: TicketsService, useValue: mockTicketsService }],
    }).compile();

    controller = module.get<TicketsController>(TicketsController);
    service = module.get<TicketsService>(TicketsService);
  });

  describe('create', () => {
    it('should call TicketsService.create and return the created ticket', async () => {
      const createTicketDto: CreateTicketDto = {
        serviceId: '1',
        attendantId: '1',
        clientId: '1',
        status: 'OPEN',
      };
      const createdTicket = { id: 'ticket1', ...createTicketDto };

      jest.spyOn(service, 'create').mockResolvedValue(createdTicket);

      expect(await controller.create(createTicketDto)).toEqual(createdTicket);
      expect(service.create).toHaveBeenCalledWith(createTicketDto);
    });
  });

  describe('findAll', () => {
    it('should return an array of tickets', async () => {
      const tickets: {
        id: string;
        serviceId: string;
        attendantId: string;
        clientId: string;
        status: TicketStatus; // Certifique-se de usar o tipo correto
        createdAt: Date;
        updatedAt: Date;
      }[] = [
        {
          id: '1',
          serviceId: 'service-1',
          attendantId: 'attendant-1',
          clientId: 'client-1',
          status: TicketStatus.OPEN, // Exemplo de enum
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      jest.spyOn(service, 'findAll').mockResolvedValue(tickets);

      expect(await controller.findAll()).toEqual(tickets);
    });
  });

  describe('findOne', () => {
    it('should return a ticket by id', async () => {
      const ticket: {
        id: string;
        serviceId: string;
        attendantId: string;
        clientId: string;
        status: TicketStatus; // Certifique-se de usar o tipo correto
        createdAt: Date;
        updatedAt: Date;
      } = {
        id: '1',
        serviceId: 'service-1',
        attendantId: 'attendant-1',
        clientId: 'client-1',
        status: TicketStatus.OPEN, // Exemplo de enum
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      jest.spyOn(service, 'findTicket').mockResolvedValue(ticket);

      expect(await controller.findOne('ticket1')).toEqual(ticket);
    });
  });

  describe('update', () => {
    it('should update a ticket and return the updated ticket', async () => {
      const updateTicketDto: UpdateTicketDto = { status: TicketStatus.CLOSED };
      const updatedTicket = {
        id: 'ticket1',
        serviceId: 'service1',
        attendantId: 'attendant1',
        clientId: 'client1',
        status: TicketStatus.CLOSED,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      jest.spyOn(service, 'update').mockResolvedValue(updatedTicket);

      expect(await controller.update('ticket1', updateTicketDto)).toEqual(
        updatedTicket,
      );
      expect(service.update).toHaveBeenCalledWith('ticket1', updateTicketDto);
    });
  });

  describe('remove', () => {
    it('should remove a ticket and return it', async () => {
      const ticket: {
        id: string;
        serviceId: string;
        attendantId: string;
        clientId: string;
        status: TicketStatus; // Certifique-se de usar o tipo correto
        createdAt: Date;
        updatedAt: Date;
      } = {
        id: '1',
        serviceId: 'service-1',
        attendantId: 'attendant-1',
        clientId: 'client-1',
        status: TicketStatus.OPEN, // Exemplo de enum
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      jest.spyOn(service, 'remove').mockResolvedValue(ticket);

      expect(await controller.remove('ticket1')).toEqual(ticket);
      expect(service.remove).toHaveBeenCalledWith('ticket1');
    });
  });
});
