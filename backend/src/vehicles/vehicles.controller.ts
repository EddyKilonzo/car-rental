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
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiBody,
} from '@nestjs/swagger';
import { VehiclesService } from './vehicles.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { CreateBookingForCustomerDto } from './dto/create-booking-for-customer.dto';
import { CreateReviewDto } from './dto/create-review.dto';
import { SearchVehiclesDto } from './dto/search-vehicles.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole, BookingStatus } from '@prisma/client';

interface RequestWithUser extends Request {
  user: {
    id: string;
    role: string;
  };
}

@ApiTags('vehicles')
@Controller('vehicles')
export class VehiclesController {
  constructor(private readonly vehiclesService: VehiclesService) {}

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
}
