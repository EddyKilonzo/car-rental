import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { CloudinaryService } from '../common/dto/cloudinary/cloudinary.service';

@Module({
  controllers: [UsersController],
  providers: [UsersService, CloudinaryService],
  exports: [UsersService], // Export so other modules can use it
})
export class UsersModule {}
