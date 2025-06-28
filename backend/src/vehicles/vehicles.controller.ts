import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  HttpStatus,
  HttpException,
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
  ForbiddenException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiBody,
  ApiConsumes,
} from '@nestjs/swagger';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { VehiclesService } from './vehicles.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { CreateBookingForCustomerDto } from './dto/create-booking-for-customer.dto';
import { CreateReviewDto } from './dto/create-review.dto';
import { SearchVehiclesDto } from './dto/search-vehicles.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole, BookingStatus } from '@prisma/client';
import {
  CloudinaryService,
  CarRentalUploadType,
} from '../common/dto/cloudinary/cloudinary.service';
import { PrismaService } from '../prisma/prisma.service';

interface RequestWithUser extends Request {
  user: {
    id: string;
    role: string;
  };
}

@ApiTags('vehicles')
@Controller('vehicles')
export class VehiclesController {
  constructor(
    private readonly vehiclesService: VehiclesService,
    private readonly cloudinaryService: CloudinaryService,
    private readonly prismaService: PrismaService,
  ) {}

  /**
   * Check if agent is approved for vehicle operations
   */
  private async checkAgentApproval(userId: string): Promise<void> {
    const user = await this.prismaService.user.findUnique({
      where: { id: userId },
      select: { role: true, isVerified: true },
    });

    if (!user) {
      throw new ForbiddenException('User not found');
    }

    if (user.role === UserRole.AGENT && !user.isVerified) {
      throw new ForbiddenException(
        'Agent must be approved before uploading vehicle images',
      );
    }
  }

  @Get()
  @ApiOperation({ summary: 'Get all available vehicles' })
  @ApiResponse({ status: 200, description: 'List of available vehicles' })
  async getAllVehicles() {
    try {
      return await this.vehiclesService.getAllVehicles();
    } catch (error) {
      throw new HttpException(
        error instanceof Error ? error.message : 'Unknown error',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Get('search')
  @ApiOperation({ summary: 'Search vehicles with filters' })
  @ApiQuery({
    name: 'vehicleType',
    required: false,
    description: 'Filter by vehicle type',
  })
  @ApiQuery({
    name: 'fuelType',
    required: false,
    description: 'Filter by fuel type',
  })
  @ApiQuery({
    name: 'minPrice',
    required: false,
    description: 'Minimum price per day',
  })
  @ApiQuery({
    name: 'maxPrice',
    required: false,
    description: 'Maximum price per day',
  })
  @ApiResponse({ status: 200, description: 'Filtered list of vehicles' })
  async searchVehicles(@Query() filters: SearchVehiclesDto) {
    try {
      return await this.vehiclesService.searchVehicles(filters);
    } catch (error) {
      throw new HttpException(
        error instanceof Error ? error.message : 'Unknown error',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Get(':id')
  async getVehicleById(@Param('id') id: string) {
    try {
      return await this.vehiclesService.getVehicleById(id);
    } catch (error) {
      throw new HttpException(
        error instanceof Error ? error.message : 'Unknown error',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Get(':id/reviews')
  async getVehicleReviews(@Param('id') vehicleId: string) {
    try {
      return await this.vehiclesService.getVehicleReviews(vehicleId);
    } catch (error) {
      throw new HttpException(
        error instanceof Error ? error.message : 'Unknown error',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.CUSTOMER, UserRole.AGENT)
  @Post('bookings')
  @ApiOperation({ summary: 'Create a new booking' })
  @ApiBearerAuth('JWT-auth')
  @ApiBody({ type: CreateBookingDto })
  @ApiResponse({ status: 201, description: 'Booking created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid booking data' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Customer or Agent role required',
  })
  async createBooking(
    @Request() req: RequestWithUser,
    @Body() bookingData: CreateBookingDto,
  ) {
    try {
      return await this.vehiclesService.createBooking(req.user.id, bookingData);
    } catch (error) {
      throw new HttpException(
        error instanceof Error ? error.message : 'Unknown error',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.AGENT)
  @Post('bookings/agent')
  async createBookingAsAgent(
    @Request() req: RequestWithUser,
    @Body() bookingData: CreateBookingForCustomerDto,
  ) {
    try {
      const result = await this.vehiclesService.createBookingForCustomer(
        req.user.id,
        bookingData,
      );
      return result;
    } catch (error) {
      throw new HttpException(
        error instanceof Error ? error.message : 'Unknown error',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @UseGuards(JwtAuthGuard)
  @Get('bookings/my')
  async getUserBookings(@Request() req: RequestWithUser) {
    try {
      return await this.vehiclesService.getUserBookings(req.user.id);
    } catch (error) {
      throw new HttpException(
        error instanceof Error ? error.message : 'Unknown error',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @UseGuards(JwtAuthGuard)
  @Get('bookings/:id')
  async getBookingById(
    @Request() req: RequestWithUser,
    @Param('id') bookingId: string,
  ) {
    try {
      return await this.vehiclesService.getBookingById(req.user.id, bookingId);
    } catch (error) {
      throw new HttpException(
        error instanceof Error ? error.message : 'Unknown error',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.CUSTOMER, UserRole.AGENT)
  @Put('bookings/:id/cancel')
  async cancelBooking(
    @Request() req: RequestWithUser,
    @Param('id') bookingId: string,
  ) {
    try {
      return await this.vehiclesService.cancelBooking(req.user.id, bookingId);
    } catch (error) {
      throw new HttpException(
        error instanceof Error ? error.message : 'Unknown error',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.CUSTOMER, UserRole.AGENT)
  @Post('reviews')
  async createReview(
    @Request() req: RequestWithUser,
    @Body() reviewData: CreateReviewDto,
  ) {
    try {
      return await this.vehiclesService.createReview(req.user.id, reviewData);
    } catch (error) {
      throw new HttpException(
        error instanceof Error ? error.message : 'Unknown error',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.AGENT, UserRole.ADMIN)
  @Put('bookings/:id/confirm')
  async confirmBooking(
    @Request() req: RequestWithUser,
    @Param('id') bookingId: string,
  ) {
    try {
      const result = await this.vehiclesService.updateBookingStatus(
        req.user.id,
        bookingId,
        'CONFIRMED' as BookingStatus,
      );
      return result;
    } catch (error) {
      throw new HttpException(
        error instanceof Error ? error.message : 'Unknown error',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.AGENT, UserRole.ADMIN)
  @Put('bookings/:id/complete')
  async completeBooking(
    @Request() req: RequestWithUser,
    @Param('id') bookingId: string,
  ) {
    try {
      return await this.vehiclesService.updateBookingStatus(
        req.user.id,
        bookingId,
        'COMPLETED' as BookingStatus,
      );
    } catch (error) {
      throw new HttpException(
        error instanceof Error ? error.message : 'Unknown error',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.AGENT, UserRole.ADMIN)
  @Put('bookings/:id/activate')
  async activateBooking(
    @Request() req: RequestWithUser,
    @Param('id') bookingId: string,
  ) {
    try {
      return await this.vehiclesService.updateBookingStatus(
        req.user.id,
        bookingId,
        'ACTIVE' as BookingStatus,
      );
    } catch (error) {
      throw new HttpException(
        error instanceof Error ? error.message : 'Unknown error',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Get('bookings/all')
  async getAllBookings(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
  ) {
    try {
      return await this.vehiclesService.getAllBookings(
        parseInt(page),
        parseInt(limit),
      );
    } catch (error) {
      throw new HttpException(
        error instanceof Error ? error.message : 'Unknown error',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.AGENT, UserRole.ADMIN)
  @Get('bookings/status/:status')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get bookings by status (Admin only)' })
  @ApiResponse({ status: 200, description: 'List of bookings by status' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin role required',
  })
  async getBookingsByStatus(@Param('status') status: string) {
    try {
      return await this.vehiclesService.getBookingsByStatus(
        status as BookingStatus,
      );
    } catch (error) {
      throw new HttpException(
        error instanceof Error ? error.message : 'Unknown error',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  // ========================================
  // VEHICLE IMAGE UPLOAD ENDPOINTS
  // ========================================

  /**
   * Upload main vehicle image (approved agents/admins only)
   */
  @Post('upload/main-image')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.AGENT, UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Upload main vehicle image',
    description:
      'Upload a main vehicle image to Cloudinary (approved agents/admins only)',
  })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file'))
  @ApiResponse({
    status: 200,
    description: 'Main vehicle image uploaded successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Agent must be approved',
  })
  @ApiResponse({ status: 400, description: 'Invalid file or upload failed' })
  async uploadMainImage(
    @Request() req: RequestWithUser,
    @UploadedFile() file: Express.Multer.File,
  ) {
    try {
      // Check if agent is approved
      await this.checkAgentApproval(req.user.id);

      // Upload to Cloudinary
      const uploadResult = await this.cloudinaryService.uploadFile(
        file,
        CarRentalUploadType.VEHICLE_MAIN,
      );

      return {
        message: 'Main vehicle image uploaded successfully',
        uploadResult: {
          secure_url: uploadResult.secure_url,
          public_id: uploadResult.public_id,
          width: uploadResult.width,
          height: uploadResult.height,
        },
      };
    } catch (error) {
      throw new HttpException(
        error instanceof Error ? error.message : 'Upload failed',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  /**
   * Upload vehicle gallery images (approved agents/admins only)
   */
  @Post('upload/gallery')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.AGENT, UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Upload vehicle gallery images',
    description:
      'Upload multiple vehicle gallery images to Cloudinary (approved agents/admins only)',
  })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FilesInterceptor('files', 10)) // Max 10 files
  @ApiResponse({
    status: 200,
    description: 'Vehicle gallery images uploaded successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Agent must be approved',
  })
  @ApiResponse({ status: 400, description: 'Invalid files or upload failed' })
  async uploadGalleryImages(
    @Request() req: RequestWithUser,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    try {
      if (!files || files.length === 0) {
        throw new HttpException('No files provided', HttpStatus.BAD_REQUEST);
      }

      if (files.length > 10) {
        throw new HttpException(
          'Maximum 10 files allowed',
          HttpStatus.BAD_REQUEST,
        );
      }

      // Check if agent is approved
      await this.checkAgentApproval(req.user.id);

      // Upload to Cloudinary
      const uploadResults = await this.cloudinaryService.uploadMultipleFiles(
        files,
        CarRentalUploadType.VEHICLE_GALLERY,
      );

      return {
        message: 'Vehicle gallery images uploaded successfully',
        uploadResults: uploadResults.map((result) => ({
          secure_url: result.secure_url,
          public_id: result.public_id,
          width: result.width,
          height: result.height,
        })),
      };
    } catch (error) {
      throw new HttpException(
        error instanceof Error ? error.message : 'Upload failed',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  /**
   * Upload vehicle interior images (approved agents/admins only)
   */
  @Post('upload/interior')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.AGENT, UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Upload vehicle interior images',
    description:
      'Upload vehicle interior images to Cloudinary (approved agents/admins only)',
  })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FilesInterceptor('files', 5)) // Max 5 files
  @ApiResponse({
    status: 200,
    description: 'Vehicle interior images uploaded successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Agent must be approved',
  })
  @ApiResponse({ status: 400, description: 'Invalid files or upload failed' })
  async uploadInteriorImages(
    @Request() req: RequestWithUser,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    try {
      if (!files || files.length === 0) {
        throw new HttpException('No files provided', HttpStatus.BAD_REQUEST);
      }

      // Check if agent is approved
      await this.checkAgentApproval(req.user.id);

      // Upload to Cloudinary
      const uploadResults = await this.cloudinaryService.uploadMultipleFiles(
        files,
        CarRentalUploadType.VEHICLE_INTERIOR,
      );

      return {
        message: 'Vehicle interior images uploaded successfully',
        uploadResults: uploadResults.map((result) => ({
          secure_url: result.secure_url,
          public_id: result.public_id,
          width: result.width,
          height: result.height,
        })),
      };
    } catch (error) {
      throw new HttpException(
        error instanceof Error ? error.message : 'Upload failed',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  /**
   * Upload vehicle exterior images (approved agents/admins only)
   */
  @Post('upload/exterior')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.AGENT, UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Upload vehicle exterior images',
    description:
      'Upload vehicle exterior images to Cloudinary (approved agents/admins only)',
  })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FilesInterceptor('files', 8)) // Max 8 files
  @ApiResponse({
    status: 200,
    description: 'Vehicle exterior images uploaded successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Agent must be approved',
  })
  @ApiResponse({ status: 400, description: 'Invalid files or upload failed' })
  async uploadExteriorImages(
    @Request() req: RequestWithUser,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    try {
      if (!files || files.length === 0) {
        throw new HttpException('No files provided', HttpStatus.BAD_REQUEST);
      }

      // Check if agent is approved
      await this.checkAgentApproval(req.user.id);

      // Upload to Cloudinary
      const uploadResults = await this.cloudinaryService.uploadMultipleFiles(
        files,
        CarRentalUploadType.VEHICLE_EXTERIOR,
      );

      return {
        message: 'Vehicle exterior images uploaded successfully',
        uploadResults: uploadResults.map((result) => ({
          secure_url: result.secure_url,
          public_id: result.public_id,
          width: result.width,
          height: result.height,
        })),
      };
    } catch (error) {
      throw new HttpException(
        error instanceof Error ? error.message : 'Upload failed',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  /**
   * Upload vehicle documents (approved agents/admins only)
   */
  @Post('upload/documents')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.AGENT, UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Upload vehicle documents',
    description:
      'Upload vehicle documents (registration, insurance, etc.) to Cloudinary (approved agents/admins only)',
  })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FilesInterceptor('files', 5)) // Max 5 files
  @ApiResponse({
    status: 200,
    description: 'Vehicle documents uploaded successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Agent must be approved',
  })
  @ApiResponse({ status: 400, description: 'Invalid files or upload failed' })
  async uploadDocuments(
    @Request() req: RequestWithUser,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    try {
      if (!files || files.length === 0) {
        throw new HttpException('No files provided', HttpStatus.BAD_REQUEST);
      }

      // Check if agent is approved
      await this.checkAgentApproval(req.user.id);

      // Upload to Cloudinary
      const uploadResults = await this.cloudinaryService.uploadMultipleFiles(
        files,
        CarRentalUploadType.VEHICLE_DOCUMENTS,
      );

      return {
        message: 'Vehicle documents uploaded successfully',
        uploadResults: uploadResults.map((result) => ({
          secure_url: result.secure_url,
          public_id: result.public_id,
        })),
      };
    } catch (error) {
      throw new HttpException(
        error instanceof Error ? error.message : 'Upload failed',
        HttpStatus.BAD_REQUEST,
      );
    }
  }
}
