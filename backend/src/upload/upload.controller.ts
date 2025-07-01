import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
  Body,
  UseGuards,
  Request,
  BadRequestException,
  HttpException,
  HttpStatus,
  ForbiddenException,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiConsumes,
  ApiBearerAuth,
} from '@nestjs/swagger';
import {
  CloudinaryService,
  CarRentalUploadType,
  CloudinaryUploadResult,
} from '../common/dto/cloudinary/cloudinary.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

interface RequestWithUser extends Request {
  user: {
    id: string;
    role: string;
  };
}

@ApiTags('Upload')
@Controller('upload')
export class UploadController {
  constructor(
    private readonly cloudinaryService: CloudinaryService,
    private readonly prismaService: PrismaService,
  ) {}

  /**
   * Check if agent is approved for vehicle uploads
   */
  private async checkAgentApproval(userId: string): Promise<void> {
    console.log('Checking agent approval for user ID:', userId);

    const user = await this.prismaService.user.findUnique({
      where: { id: userId },
      select: { role: true, isVerified: true },
    });

    console.log('User found:', user);

    if (!user) {
      console.log('User not found');
      throw new ForbiddenException('User not found');
    }

    console.log('User role:', user.role, 'isVerified:', user.isVerified);

    if (user.role === UserRole.AGENT && !user.isVerified) {
      console.log('Agent is not verified, throwing error');
      throw new ForbiddenException(
        'Agent must be approved before uploading vehicle images',
      );
    }

    console.log('Agent approval check passed');
  }

  @Post('profile-photo')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Upload user profile photo' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file'))
  async uploadProfilePhoto(
    @Request() req: RequestWithUser,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<CloudinaryUploadResult> {
    try {
      if (!file) {
        throw new BadRequestException('No file provided');
      }

      return await this.cloudinaryService.uploadFile(
        file,
        CarRentalUploadType.USER_PROFILE,
      );
    } catch (error) {
      throw new HttpException(
        error instanceof Error ? error.message : 'Upload failed',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Post('avatar')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Upload user avatar (circular profile picture)' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file'))
  async uploadAvatar(
    @Request() req: RequestWithUser,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<CloudinaryUploadResult> {
    try {
      if (!file) {
        throw new BadRequestException('No file provided');
      }

      return await this.cloudinaryService.uploadFile(
        file,
        CarRentalUploadType.USER_PROFILE,
      );
    } catch (error) {
      throw new HttpException(
        error instanceof Error ? error.message : 'Upload failed',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Post('vehicle/main-image')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.AGENT, UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Upload main vehicle image' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file'))
  async uploadVehicleMainImage(
    @Request() req: RequestWithUser,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<CloudinaryUploadResult> {
    try {
      console.log('Upload request received for user:', req.user.id);
      console.log('File received:', file?.originalname, 'Size:', file?.size);

      if (!file) {
        throw new BadRequestException('No file provided');
      }

      const result = await this.cloudinaryService.uploadFile(
        file,
        CarRentalUploadType.VEHICLE_MAIN,
      );

      console.log('Upload successful:', result);
      return result;
    } catch (error) {
      console.error('Upload error:', error);
      throw new HttpException(
        error instanceof Error ? error.message : 'Upload failed',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Post('vehicle/gallery')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.AGENT, UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Upload multiple vehicle gallery images' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FilesInterceptor('files', 10)) // Max 10 files
  async uploadVehicleGallery(
    @Request() req: RequestWithUser,
    @UploadedFiles() files: Express.Multer.File[],
  ): Promise<CloudinaryUploadResult[]> {
    try {
      if (!files || files.length === 0) {
        throw new BadRequestException('No files provided');
      }

      if (files.length > 10) {
        throw new BadRequestException('Maximum 10 files allowed');
      }

      return await this.cloudinaryService.uploadMultipleFiles(
        files,
        CarRentalUploadType.VEHICLE_GALLERY,
      );
    } catch (error) {
      throw new HttpException(
        error instanceof Error ? error.message : 'Upload failed',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Post('vehicle/interior')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.AGENT, UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Upload vehicle interior images' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FilesInterceptor('files', 5)) // Max 5 files
  async uploadVehicleInterior(
    @Request() req: RequestWithUser,
    @UploadedFiles() files: Express.Multer.File[],
  ): Promise<CloudinaryUploadResult[]> {
    try {
      if (!files || files.length === 0) {
        throw new BadRequestException('No files provided');
      }

      return await this.cloudinaryService.uploadMultipleFiles(
        files,
        CarRentalUploadType.VEHICLE_INTERIOR,
      );
    } catch (error) {
      throw new HttpException(
        error instanceof Error ? error.message : 'Upload failed',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Post('vehicle/exterior')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.AGENT, UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Upload vehicle exterior images' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FilesInterceptor('files', 8)) // Max 8 files
  async uploadVehicleExterior(
    @Request() req: RequestWithUser,
    @UploadedFiles() files: Express.Multer.File[],
  ): Promise<CloudinaryUploadResult[]> {
    try {
      if (!files || files.length === 0) {
        throw new BadRequestException('No files provided');
      }

      return await this.cloudinaryService.uploadMultipleFiles(
        files,
        CarRentalUploadType.VEHICLE_EXTERIOR,
      );
    } catch (error) {
      throw new HttpException(
        error instanceof Error ? error.message : 'Upload failed',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Post('license-document')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Upload license document' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file'))
  async uploadLicenseDocument(
    @Request() req: RequestWithUser,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<CloudinaryUploadResult> {
    try {
      if (!file) {
        throw new BadRequestException('No file provided');
      }

      return await this.cloudinaryService.uploadFile(
        file,
        CarRentalUploadType.LICENSE_DOCUMENT,
      );
    } catch (error) {
      throw new HttpException(
        error instanceof Error ? error.message : 'Upload failed',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Post('vehicle/documents')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.AGENT, UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Upload vehicle documents (registration, insurance, etc.)',
  })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FilesInterceptor('files', 5)) // Max 5 files
  async uploadVehicleDocuments(
    @Request() req: RequestWithUser,
    @UploadedFiles() files: Express.Multer.File[],
  ): Promise<CloudinaryUploadResult[]> {
    try {
      if (!files || files.length === 0) {
        throw new BadRequestException('No files provided');
      }

      return await this.cloudinaryService.uploadMultipleFiles(
        files,
        CarRentalUploadType.VEHICLE_DOCUMENTS,
      );
    } catch (error) {
      throw new HttpException(
        error instanceof Error ? error.message : 'Upload failed',
        HttpStatus.BAD_REQUEST,
      );
    }
  }
}
