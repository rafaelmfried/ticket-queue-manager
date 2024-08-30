import { Injectable } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { Attendant } from '@prisma/client';
import { CreateAttendantDto } from './dto/create-attendant.dto';

@Injectable()
export class AttendantsService {
  constructor(private prisma: PrismaService) {}

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
          connect: serviceIds.map((id) => ({ id })),
        },
      },
    });
    console.log('Novo Atendente criado:', newAttendant);
    return newAttendant;
  }

  // async findAll(): Promise<Attendant[]> {
  //   return this.prisma.attendant.findMany({
  //     include: { services: true },
  //   });
  // }

  // async findOne(id: string): Promise<Attendant> | null {
  //   return this.prisma.attendant.findUnique({
  //     where: { id },
  //     include: { services: true },
  //   });
  // }

  // async update(
  //   id: string,
  //   data: Prisma.AttendantUpdateInput,
  // ): Promise<Attendant> {
  //   const { services, ...attendantData } = data;

  //   let setArray: { id: string }[] = [];
  //   if (Array.isArray(services?.set)) {
  //     setArray = services.set.map((service) => ({ id: service.id }));
  //   } else if (services?.set) {
  //     setArray = [{ id: services.set.id }];
  //   }

  //   return this.prisma.attendant.update({
  //     where: { id },
  //     data: {
  //       ...attendantData,
  //       services: {
  //         set: setArray,
  //       },
  //     },
  //     include: { services: true },
  //   });
  // }

  // async remove(id: string): Promise<Attendant> {
  //   return this.prisma.attendant.delete({
  //     where: { id },
  //     include: { services: true },
  //   });
  // }
}
