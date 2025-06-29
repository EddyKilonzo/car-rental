import { Module } from '@nestjs/common';
import { AgentService } from './agent.service';
import { AgentController } from './agent.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { MailerModule } from '../mailer/mailer.module';
import { VehiclesModule } from '../vehicles/vehicles.module';

@Module({
  imports: [PrismaModule, MailerModule, VehiclesModule],
  providers: [AgentService],
  controllers: [AgentController],
})
export class AgentModule {}
