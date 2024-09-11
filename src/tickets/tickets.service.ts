import { Injectable } from '@nestjs/common';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { UpdateTicketDto } from './dto/update-ticket.dto';
import { PrismaService } from 'prisma/prisma.service';
import { Ticket } from '@prisma/client';

@Injectable()
export class TicketsService {
  constructor(private prisma: PrismaService) {}

  async create(data: CreateTicketDto): Promise<Ticket> {
    return await this.prisma.ticket.create({
      data,
    });
  }

  async findTicket(ticketId: string): Promise<Ticket | Error> {
    return await this.prisma.ticket.findUniqueOrThrow({
      where: { id: ticketId },
    });
  }

  async findAll(): Promise<Ticket[]> {
    return await this.prisma.ticket.findMany();
  }

  async update(ticketId: string, data: UpdateTicketDto): Promise<Ticket> {
    const { status } = data;

    return await this.prisma.ticket.update({
      where: { id: ticketId },
      data: { status },
    });
  }

  async remove(ticketId: string): Promise<Ticket> {
    return await this.prisma.ticket.delete({
      where: { id: ticketId },
    });
  }
}
