import { Module } from '@nestjs/common';
import { AttendantsService } from './attendants.service';
import { AttendantsController } from './attendants.controller';
import { PrismaService } from 'prisma/prisma.service';

@Module({
  controllers: [AttendantsController],
  providers: [AttendantsService, PrismaService],
})
export class AttendantsModule {}
