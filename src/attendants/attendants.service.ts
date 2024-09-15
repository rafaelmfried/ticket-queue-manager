import { Injectable } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { Attendant, Prisma } from '@prisma/client';
import { CreateAttendantDto } from './dto/create-attendant.dto';
import { WorkersService } from 'src/workers/workers.service';

@Injectable()
export class AttendantsService {
  constructor(
    private prisma: PrismaService,
    private workersService: WorkersService,
  ) {}

  async create(data: CreateAttendantDto): Promise<Attendant> {
    const {
      name,
      email,
      password,
      roles,
      queueStatus,
      queueLimit,
      serviceIds,
    } = data;

    // Criando um novo Attendant com serviços associados
    const newAttendant = await this.prisma.attendant.create({
      data: {
        name,
        email,
        password,
        roles,
        queueStatus,
        queueLimit,
        services: {
          connect: serviceIds ? serviceIds.map((id) => ({ id })) : [],
        },
      },
    });
    console.log('Novo Atendente criado:', newAttendant);
    return newAttendant;
  }

  async findAll(): Promise<Attendant[]> {
    return this.prisma.attendant.findMany({
      include: { services: true },
    });
  }

  // Função para mudar o status da fila do atendente
  async changeQueueStatus(attendantId: string, status: 'OPEN' | 'CLOSED') {
    // Atualiza o status da fila do atendente no banco de dados
    const updatedAttendant = await this.prisma.attendant.update({
      where: { id: attendantId },
      data: { queueStatus: status },
    });
    const queueName = `attendant-queue-${attendantId}`;
    // Chama o método do WorkersService para alterar o status da fila
    await this.workersService.changeAttendantQueueStatus(queueName, status);

    console.log(
      `Atendente ${attendantId} teve o status da fila alterado para ${status}`,
    );
    return updatedAttendant;
  }

  async findOne(id: string): Promise<Attendant> | null {
    return this.prisma.attendant.findUnique({
      where: { id },
      include: { services: true },
    });
  }

  async update(
    id: string,
    data: Prisma.AttendantUpdateInput,
  ): Promise<Attendant> {
    const { services, ...attendantData } = data;

    // Verifique a estrutura correta para o campo services
    let setArray: { id: string }[] = [];
    if (services?.set) {
      setArray = Array.isArray(services.set)
        ? services.set.map((service) => ({ id: service.id }))
        : [{ id: services.set.id }];
    }

    return this.prisma.attendant.update({
      where: { id },
      data: {
        ...attendantData,
        services: services
          ? {
              set: setArray,
            }
          : undefined,
      },
      include: { services: true },
    });
  }

  async remove(id: string): Promise<Attendant> {
    return this.prisma.attendant.delete({
      where: { id },
      include: { services: true },
    });
  }
}
