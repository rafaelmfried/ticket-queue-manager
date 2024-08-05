import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ManagersModule } from './managers/managers.module';
import { AttendantsModule } from './attendants/attendants.module';
import { UsersModule } from './users/users.module';
import { TicketsModule } from './tickets/tickets.module';
import { LinesModule } from './lines/lines.module';
import { ServicesModule } from './services/services.module';

@Module({
  imports: [ManagersModule, AttendantsModule, UsersModule, TicketsModule, LinesModule, ServicesModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
