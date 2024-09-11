import { Module } from '@nestjs/common';
import { WorkersService } from './workers.service';
import { QueueService } from 'src/queue/queue.service';

@Module({
  providers: [WorkersService, QueueService],
  exports: [WorkersService],
})
export class WorkersModule {}
