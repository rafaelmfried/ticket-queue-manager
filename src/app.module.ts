import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AttendantsModule } from './attendants/attendants.module';
import { UsersModule } from './users/users.module';
import { TicketsModule } from './tickets/tickets.module';
import { LinesModule } from './lines/lines.module';
import { ServicesModule } from './services/services.module';
import { PrismaService } from 'prisma/prisma.service';
import { ClientsModule } from './clients/clients.module';

@Module({
  imports: [
    AttendantsModule,
    UsersModule,
    TicketsModule,
    LinesModule,
    ServicesModule,
    ClientsModule,
  ],
  controllers: [AppController],
  providers: [AppService, PrismaService],
})
export class AppModule {}
