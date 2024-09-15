import { Module } from '@nestjs/common';
import { AttendantsService } from './attendants.service';
import { AttendantsController } from './attendants.controller';
import { WorkersModule } from 'src/workers/workers.module';
import { PrismaModule } from 'prisma/prisma.module';

@Module({
  controllers: [AttendantsController],
  providers: [AttendantsService],
  imports: [WorkersModule, PrismaModule],
})
export class AttendantsModule {}
