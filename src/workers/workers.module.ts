import { Module } from '@nestjs/common';
import { WorkersService } from './workers.service';
import { WorkersController } from './workers.controller';
import { QueueService } from 'src/queue/queue.service';

@Module({
  controllers: [WorkersController],
  providers: [WorkersService, QueueService],
})
export class WorkersModule {}
