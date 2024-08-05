import { Module } from '@nestjs/common';
import { AttendantsService } from './attendants.service';
import { AttendantsController } from './attendants.controller';

@Module({
  controllers: [AttendantsController],
  providers: [AttendantsService],
})
export class AttendantsModule {}
