import { Module } from '@nestjs/common';
import { TicketsService } from './tickets.service';
import { TicketsController } from './tickets.controller';
import { QueueModule } from 'src/queue/queue.module';
import { PrismaModule } from 'prisma/prisma.module';

@Module({
  controllers: [TicketsController],
  providers: [TicketsService],
  imports: [QueueModule, PrismaModule],
  exports: [TicketsService],
})
export class TicketsModule {}
