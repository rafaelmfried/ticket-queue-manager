import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { UpdateTicketDto } from './dto/update-ticket.dto';
import { PrismaService } from 'prisma/prisma.service';
import { Ticket } from '@prisma/client';
import { QueueService } from 'src/queue/queue.service';

@Injectable()
export class TicketsService {
  constructor(
    private prisma: PrismaService,
    private queueService: QueueService,
  ) {}

  async create(data: CreateTicketDto): Promise<Ticket> {
    const { attendantId } = data;
    const queueName = `attendant-queue-${attendantId}`;

    const attendant = await this.prisma.attendant.findUnique({
      where: { id: attendantId },
    });
    const service = await this.prisma.service.findUnique({
      where: { id: data.serviceId },
    });

    await this.queueService.getQueue(attendantId);

    const ticket = this.prisma.ticket.create({ data });
    await this.queueService.addJob(queueName, ticket);
    return {
      ...ticket,
      attendant: attendant.name,
      service: service.name,
    };
  }

  async findTicket(ticketId: string): Promise<Ticket> {
    try {
      return await this.prisma.ticket.findUniqueOrThrow({
        where: { id: ticketId },
      });
    } catch (error) {
      throw new NotFoundException(`Ticket with ID ${ticketId} not found.`);
    }
  }

  async findAll(): Promise<Ticket[]> {
    return this.prisma.ticket.findMany();
  }

  async update(ticketId: string, data: UpdateTicketDto): Promise<Ticket> {
    try {
      return await this.prisma.ticket.update({
        where: { id: ticketId },
        data: { status: data.status },
      });
    } catch (error) {
      throw new NotFoundException(`Ticket with ID ${ticketId} not found.`);
    }
  }

  async remove(ticketId: string): Promise<Ticket> {
    try {
      return await this.prisma.ticket.delete({
        where: { id: ticketId },
      });
    } catch (error) {
      throw new NotFoundException(`Ticket with ID ${ticketId} not found.`);
    }
  }
}
