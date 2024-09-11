import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AttendantsModule } from './attendants/attendants.module';
import { UsersModule } from './users/users.module';
import { TicketsModule } from './tickets/tickets.module';
import { ServicesModule } from './services/services.module';
import { PrismaService } from 'prisma/prisma.service';
import { ClientsModule } from './clients/clients.module';
import { QueueModule } from './queue/queue.module';
import { WorkersModule } from './workers/workers.module';

@Module({
  imports: [
    AttendantsModule,
    UsersModule,
    TicketsModule,
    ServicesModule,
    ClientsModule,
    QueueModule,
    WorkersModule,
  ],
  controllers: [AppController],
  providers: [AppService, PrismaService],
})
export class AppModule {}
