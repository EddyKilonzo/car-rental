import {
  Controller,
  Get,
  Put,
  Delete,
  Param,
  Query,
  UseGuards,
  Request,
  HttpStatus,
  HttpException,
  Body,
  Post,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole, VehicleStatus } from '@prisma/client';
import { MailerService } from '../mailer/mailer.service';

@ApiTags('Admin Dashboard')
@ApiBearerAuth()
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    private readonly mailerService: MailerService,
  ) {}

  // ========================================
  // SYSTEM STATISTICS
  // ========================================

  @Get('stats')
  @ApiOperation({ summary: 'Get system statistics (Admin only)' })
  @ApiResponse({
    status: 200,
    description: 'System statistics retrieved successfully',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Only admins can view system stats',
  })
  async getSystemStats() {
    try {
      return await this.adminService.getSystemStats();
    } catch (error) {
      throw new HttpException(
        error instanceof Error ? error.message : 'Unknown error',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  // ========================================
  // USER MANAGEMENT
  // ========================================

  @Get('users')
  @ApiOperation({
    summary: 'Get all users with pagination and filtering (Admin only)',
  })
  @ApiQuery({ name: 'page', required: false, description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, description: 'Items per page' })
  @ApiQuery({
    name: 'role',
    required: false,
    description: 'Filter by user role',
    enum: UserRole,
  })
  @ApiQuery({
    name: 'search',
    required: false,
    description: 'Search by name or email',
  })
  @ApiResponse({ status: 200, description: 'Users retrieved successfully' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Only admins can view all users',
  })
  async getAllUsers(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
    @Query('role') role?: UserRole,
    @Query('search') search?: string,
  ) {
    try {
      return await this.adminService.getAllUsers(
        parseInt(page),
        parseInt(limit),
        role,
        search,
      );
    } catch (error) {
      throw new HttpException(
        error instanceof Error ? error.message : 'Unknown error',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Get('users/:id')
  @ApiOperation({ summary: 'Get user details by ID (Admin only)' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiResponse({
    status: 200,
    description: 'User details retrieved successfully',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Only admins can view user details',
  })
  @ApiResponse({ status: 404, description: 'User not found' })
  async getUserDetails(@Param('id') userId: string) {
    try {
      return await this.adminService.getUserDetails(userId);
    } catch (error) {
      throw new HttpException(
        error instanceof Error ? error.message : 'Unknown error',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Put('users/:id/role')
  @ApiOperation({ summary: 'Update user role (Admin only)' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiResponse({ status: 200, description: 'User role updated successfully' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Only admins can update user roles',
  })
  @ApiResponse({ status: 404, description: 'User not found' })
  async updateUserRole(
    @Param('id') userId: string,
    @Body() body: { role: UserRole },
  ) {
    try {
      return await this.adminService.updateUserRole(userId, body.role);
    } catch (error) {
      throw new HttpException(
        error instanceof Error ? error.message : 'Unknown error',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Put('users/:id/toggle-status')
  @ApiOperation({ summary: 'Toggle user active status (Admin only)' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiResponse({ status: 200, description: 'User status toggled successfully' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Only admins can toggle user status',
  })
  @ApiResponse({ status: 404, description: 'User not found' })
  async toggleUserStatus(@Param('id') userId: string) {
    try {
      return await this.adminService.toggleUserStatus(userId);
    } catch (error) {
      throw new HttpException(
        error instanceof Error ? error.message : 'Unknown error',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  // ========================================
  // VEHICLE MANAGEMENT
  // ========================================

  @Get('vehicles')
  @ApiOperation({
    summary: 'Get all vehicles with pagination and filtering (Admin only)',
  })
  @ApiQuery({ name: 'page', required: false, description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, description: 'Items per page' })
  @ApiQuery({
    name: 'status',
    required: false,
    description: 'Filter by vehicle status',
    enum: VehicleStatus,
  })
  @ApiQuery({
    name: 'search',
    required: false,
    description: 'Search by make, model, or license plate',
  })
  @ApiResponse({ status: 200, description: 'Vehicles retrieved successfully' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Only admins can view all vehicles',
  })
  async getAllVehicles(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
    @Query('status') status?: VehicleStatus,
    @Query('search') search?: string,
  ) {
    try {
      return await this.adminService.getAllVehicles(
        parseInt(page),
        parseInt(limit),
        status,
        search,
      );
    } catch (error) {
      throw new HttpException(
        error instanceof Error ? error.message : 'Unknown error',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Get('vehicles/:id')
  @ApiOperation({ summary: 'Get vehicle details by ID (Admin only)' })
  @ApiParam({ name: 'id', description: 'Vehicle ID' })
  @ApiResponse({
    status: 200,
    description: 'Vehicle details retrieved successfully',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Only admins can view vehicle details',
  })
  @ApiResponse({ status: 404, description: 'Vehicle not found' })
  async getVehicleDetails(@Param('id') vehicleId: string) {
    try {
      return await this.adminService.getVehicleDetails(vehicleId);
    } catch (error) {
      throw new HttpException(
        error instanceof Error ? error.message : 'Unknown error',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Put('vehicles/:id/toggle-status')
  @ApiOperation({ summary: 'Toggle vehicle active status (Admin only)' })
  @ApiParam({ name: 'id', description: 'Vehicle ID' })
  @ApiResponse({
    status: 200,
    description: 'Vehicle status toggled successfully',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Only admins can toggle vehicle status',
  })
  @ApiResponse({ status: 404, description: 'Vehicle not found' })
  async toggleVehicleStatus(@Param('id') vehicleId: string) {
    try {
      return await this.adminService.toggleVehicleStatus(vehicleId);
    } catch (error) {
      throw new HttpException(
        error instanceof Error ? error.message : 'Unknown error',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  // ========================================
  // REVIEW MANAGEMENT
  // ========================================

  @Get('reviews')
  @ApiOperation({
    summary: 'Get all reviews with pagination and filtering (Admin only)',
  })
  @ApiQuery({ name: 'page', required: false, description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, description: 'Items per page' })
  @ApiQuery({
    name: 'minRating',
    required: false,
    description: 'Minimum rating filter',
  })
  @ApiQuery({
    name: 'maxRating',
    required: false,
    description: 'Maximum rating filter',
  })
  @ApiResponse({ status: 200, description: 'Reviews retrieved successfully' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Only admins can view all reviews',
  })
  async getAllReviews(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
    @Query('minRating') minRating?: string,
    @Query('maxRating') maxRating?: string,
  ) {
    try {
      const data = await this.adminService.getAllReviews(
        parseInt(page),
        parseInt(limit),
        minRating ? parseInt(minRating) : undefined,
        maxRating ? parseInt(maxRating) : undefined,
      );

      return {
        success: true,
        data,
        message: 'Reviews retrieved successfully',
      };
    } catch (error) {
      throw new HttpException(
        error instanceof Error ? error.message : 'Unknown error',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Get('reviews/stats')
  @ApiOperation({ summary: 'Get review statistics (Admin only)' })
  @ApiResponse({
    status: 200,
    description: 'Review statistics retrieved successfully',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Only admins can view review stats',
  })
  async getReviewStats() {
    try {
      const data = await this.adminService.getReviewStats();

      return {
        success: true,
        data,
        message: 'Review statistics retrieved successfully',
      };
    } catch (error) {
      throw new HttpException(
        error instanceof Error ? error.message : 'Unknown error',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Delete('reviews/:id')
  @ApiOperation({ summary: 'Delete a review (Admin only)' })
  @ApiParam({ name: 'id', description: 'Review ID' })
  @ApiResponse({ status: 200, description: 'Review deleted successfully' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Only admins can delete reviews',
  })
  @ApiResponse({ status: 404, description: 'Review not found' })
  async deleteReview(@Param('id') reviewId: string) {
    try {
      const data = await this.adminService.deleteReview(reviewId);

      return {
        success: true,
        data,
        message: 'Review deleted successfully',
      };
    } catch (error) {
      throw new HttpException(
        error instanceof Error ? error.message : 'Unknown error',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Post('send-email')
  @ApiOperation({
    summary: 'Send all email templates for testing (Admin only)',
  })
  @ApiResponse({ status: 200, description: 'Email sent successfully' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Only admins can send emails',
  })
  async sendAllEmailTemplates() {
    try {
      await this.mailerService.sendAllEmailTemplates();

      return {
        success: true,
        message: 'All email templates sent successfully',
      };
    } catch (error) {
      throw new HttpException(
        error instanceof Error ? error.message : 'Unknown error',
        HttpStatus.BAD_REQUEST,
      );
    }
  }
}
