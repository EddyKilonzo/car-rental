import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  Request,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiParam,
  ApiConsumes,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { CompleteProfileDto } from './dto/complete-profile.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import {
  CloudinaryService,
  CarRentalUploadType,
} from '../common/dto/cloudinary/cloudinary.service';

interface RequestWithUser extends Request {
  user: {
    id: string;
    role: string;
  };
}

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  /**
   * Register a new user (public endpoint)
   */
  @Post('register')
  @ApiOperation({
    summary: 'Register a new user',
    description: 'Create a new user account. Default role is CUSTOMER.',
  })
  @ApiResponse({
    status: 201,
    description: 'User registered successfully',
  })
  @ApiResponse({
    status: 409,
    description: 'User with this email already exists',
  })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  async create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  /**
   * Get all users (admin only)
   */
  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get all users',
    description: 'Retrieve all users with pagination. Admin access required.',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number (default: 1)',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Items per page (default: 10)',
  })
  @ApiResponse({
    status: 200,
    description: 'List of users retrieved successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin access required',
  })
  async findAll(@Query('page') page?: number, @Query('limit') limit?: number) {
    return this.usersService.findAll(page, limit);
  }

  /**
   * Get user profile (authenticated user)
   */
  @Get('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get user profile',
    description: "Get the current user's profile with rental history",
  })
  @ApiResponse({
    status: 200,
    description: 'User profile retrieved successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async getProfile(@Request() req: { user: { id: string } }) {
    return this.usersService.getProfile(req.user.id);
  }

  /**
   * Get a specific user by ID (admin only)
   */
  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get user by ID',
    description: 'Retrieve a specific user by their ID. Admin access required.',
  })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiResponse({ status: 200, description: 'User found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin access required',
  })
  @ApiResponse({ status: 404, description: 'User not found' })
  async findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  /**
   * Update user profile (authenticated user)
   */
  @Patch('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Update user profile',
    description:
      "Update the current user's profile information including image URLs",
  })
  @ApiResponse({ status: 200, description: 'User updated successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  async updateProfile(
    @Request() req: { user: { id: string } },
    @Body() updateProfileDto: UpdateProfileDto,
  ) {
    return this.usersService.updateProfile(req.user.id, updateProfileDto);
  }

  /**
   * Upload profile photo (authenticated user)
   */
  @Post('profile/upload-photo')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Upload and set profile photo',
    description:
      'Upload a profile photo to Cloudinary and automatically update the user profile in one step',
  })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file'))
  @ApiResponse({
    status: 200,
    description: 'Profile photo uploaded and profile updated successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 400, description: 'Invalid file or upload failed' })
  async uploadProfilePhoto(
    @Request() req: RequestWithUser,
    @UploadedFile() file: Express.Multer.File,
  ) {
    // Upload to Cloudinary
    const uploadResult = await this.cloudinaryService.uploadFile(
      file,
      CarRentalUploadType.USER_PROFILE,
    );

    // Update user profile with the new image URL
    const updatedUser = await this.usersService.updateProfile(req.user.id, {
      profileImageUrl: uploadResult.secure_url,
    });

    return {
      message: 'Profile photo uploaded and profile updated successfully',
      uploadResult: {
        secure_url: uploadResult.secure_url,
        public_id: uploadResult.public_id,
        width: uploadResult.width,
        height: uploadResult.height,
      },
      user: updatedUser.data,
    };
  }

  /**
   * Upload license document (authenticated user)
   */
  @Post('profile/upload-license')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Upload and set license document',
    description:
      'Upload a license document to Cloudinary and automatically update the user profile',
  })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file'))
  @ApiResponse({
    status: 200,
    description: 'License document uploaded and profile updated successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 400, description: 'Invalid file or upload failed' })
  async uploadLicenseDocument(
    @Request() req: RequestWithUser,
    @UploadedFile() file: Express.Multer.File,
  ) {
    // Upload to Cloudinary with public access
    const uploadResult = await this.cloudinaryService.uploadFile(
      file,
      CarRentalUploadType.LICENSE_DOCUMENT,
      { access_mode: 'public' },
    );

    // Update user profile with the new license document URL
    const updatedUser = await this.usersService.updateProfile(req.user.id, {
      licenseDocumentUrl: uploadResult.secure_url,
    });

    return {
      message: 'License document uploaded and profile updated successfully',
      uploadResult: {
        secure_url: uploadResult.secure_url,
        public_id: uploadResult.public_id,
        public_url: this.cloudinaryService.generatePublicDocumentUrl(
          uploadResult.public_id,
        ),
        download_url: this.cloudinaryService.generateDownloadUrl(
          uploadResult.public_id,
          uploadResult.original_filename,
        ),
      },
      user: updatedUser.data,
    };
  }

  /**
   * Delete existing license document (authenticated user)
   */
  @Delete('profile/delete-license')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Delete existing license document',
    description:
      'Delete the current license document from Cloudinary and clear from user profile',
  })
  @ApiResponse({
    status: 200,
    description: 'License document deleted successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'No license document found' })
  async deleteLicenseDocument(@Request() req: RequestWithUser) {
    // Get current user profile
    const userProfile = await this.usersService.getProfile(req.user.id);

    if (!userProfile.data || !userProfile.data.licenseDocumentUrl) {
      return {
        message: 'No license document found to delete',
        success: true,
      };
    }

    // Extract public ID from the URL
    const publicId = this.cloudinaryService.extractPublicId(
      userProfile.data.licenseDocumentUrl,
    );

    try {
      // Delete from Cloudinary
      await this.cloudinaryService.deleteFile(publicId);
    } catch (error) {
      // Continue even if Cloudinary deletion fails (file might already be gone)
      console.warn('Failed to delete from Cloudinary:', error);
    }

    // Clear the URL from user profile
    const updatedUser = await this.usersService.updateProfile(req.user.id, {
      licenseDocumentUrl: null,
    });

    return {
      message: 'License document deleted successfully',
      user: updatedUser.data,
    };
  }

  /**
   * Get alternative URLs for the current license document
   */
  @Get('profile/license-urls')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get alternative URLs for license document',
    description:
      'Generate different URL formats for the current license document',
  })
  async getLicenseDocumentUrls(@Request() req: RequestWithUser) {
    const userProfile = await this.usersService.getProfile(req.user.id);

    if (!userProfile.data || !userProfile.data.licenseDocumentUrl) {
      return {
        message: 'No license document found',
        urls: null,
      };
    }

    const publicId = this.cloudinaryService.extractPublicId(
      userProfile.data.licenseDocumentUrl,
    );

    return {
      message: 'Alternative URLs generated',
      current_url: userProfile.data.licenseDocumentUrl,
      alternative_urls: {
        public_url: this.cloudinaryService.generatePublicDocumentUrl(publicId),
        download_url: this.cloudinaryService.generateDownloadUrl(publicId),
        signed_url: this.cloudinaryService.generateSignedUrl(publicId, 3600),
      },
    };
  }

  /**
   * Complete user profile for car rental
   */
  @Patch('profile/complete')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Complete user profile for car rental',
    description:
      'Provide required information (license, address, etc.) for car rental',
  })
  @ApiResponse({ status: 200, description: 'Profile completed successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  async completeProfile(
    @Request() req: { user: { id: string } },
    @Body() completeProfileDto: CompleteProfileDto,
  ) {
    return this.usersService.completeProfile(req.user.id, completeProfileDto);
  }

  /**
   * Soft delete user profile (authenticated user)
   */
  @Delete('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Soft delete user profile',
    description: 'Deactivate the current user account (soft delete)',
  })
  @ApiResponse({ status: 200, description: 'Profile deactivated successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async deactivateProfile(@Request() req: { user: { id: string } }) {
    return this.usersService.remove(req.user.id);
  }

  /**
   * Permanently delete user profile (authenticated user)
   */
  @Delete('profile/permanent')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Permanently delete user profile',
    description:
      'Permanently delete the current user account (cannot be undone)',
  })
  @ApiResponse({ status: 200, description: 'Profile permanently deleted' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async deleteProfilePermanently(@Request() req: { user: { id: string } }) {
    return this.usersService.deletePermanently(req.user.id);
  }

  /**
   * Update user (admin only)
   */
  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Update user',
    description: 'Update a specific user. Admin access required.',
  })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiResponse({ status: 200, description: 'User updated successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin access required',
  })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  async update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(id, updateUserDto);
  }

  /**
   * Remove user (admin only)
   */
  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Remove user',
    description: 'Soft delete a specific user. Admin access required.',
  })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiResponse({ status: 200, description: 'User removed successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin access required',
  })
  @ApiResponse({ status: 404, description: 'User not found' })
  async remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }
}
