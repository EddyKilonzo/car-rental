import { Module } from '@nestjs/common';
import { VehiclesController } from './vehicles.controller';
import { VehiclesService } from './vehicles.service';
import { PrismaModule } from '../prisma/prisma.module';
import { CloudinaryService } from '../common/dto/cloudinary/cloudinary.service';

@Module({
  imports: [PrismaModule],
  controllers: [VehiclesController],
  providers: [VehiclesService, CloudinaryService],
  exports: [VehiclesService],
})
export class VehiclesModule {}
