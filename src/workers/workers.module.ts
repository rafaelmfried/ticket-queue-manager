import { Module } from '@nestjs/common';
import { WorkersService } from './workers.service';
import { QueueModule } from 'src/queue/queue.module';
import { TicketsModule } from 'src/tickets/tickets.module';

@Module({
  providers: [WorkersService],
  imports: [QueueModule, TicketsModule],
  exports: [WorkersService],
})
export class WorkersModule {}
