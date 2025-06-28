import { Module } from '@nestjs/common';
import { UploadController } from './upload.controller';
import { CloudinaryService } from '../common/dto/cloudinary/cloudinary.service';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  controllers: [UploadController],
  providers: [CloudinaryService, PrismaService],
  exports: [CloudinaryService],
})
export class UploadModule {}
