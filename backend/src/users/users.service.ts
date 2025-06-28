import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { CompleteProfileDto } from './dto/complete-profile.dto';
import {
  UserResponse,
  UserProfileResponse,
  PaginatedUsersResponse,
} from './interfaces/user.interface';
import { ApiResponse } from '../common/dto/interfaces/api-response.interface';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  /**
   * Create a new user
   * - Validates email uniqueness
   * - Hashes password securely
   * - Returns user data without password
   */
  async create(
    createUserDto: CreateUserDto,
  ): Promise<ApiResponse<UserResponse>> {
    // Check if user already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email: createUserDto.email },
    });

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // Hash password for security
    const hashedPassword = await bcrypt.hash(createUserDto.password, 12);

    // Create user with only essential fields
    const user = await this.prisma.user.create({
      data: {
        email: createUserDto.email,
        name: createUserDto.name,
        password: hashedPassword,
        phone: createUserDto.phone || null,
        role: createUserDto.role,

        licenseNumber: null,
        dateOfBirth: null,
        address: null,
        city: null,
        state: null,
        zipCode: null,
        country: null,
        isVerified: false,
      },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        licenseNumber: true,
        dateOfBirth: true,
        address: true,
        city: true,
        state: true,
        zipCode: true,
        country: true,
        isVerified: true,
      },
    });

    return {
      success: true,
      message: 'User created successfully',
      data: user as UserResponse,
    };
  }

  /**
   * Get all users (with pagination for admin use)
   */
  async findAll(
    page: number = 1,
    limit: number = 10,
  ): Promise<ApiResponse<PaginatedUsersResponse>> {
    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        skip,
        take: limit,
        select: {
          id: true,
          email: true,
          name: true,
          phone: true,
          role: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.count(),
    ]);

    return {
      success: true,
      message: 'Users retrieved successfully',
      data: {
        users: users as UserResponse[],
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      },
    };
  }

  /**
   * Get a single user by ID
   */
  async findOne(id: string): Promise<ApiResponse<UserResponse>> {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        licenseNumber: true,
        dateOfBirth: true,
        address: true,
        city: true,
        state: true,
        zipCode: true,
        country: true,
        isVerified: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return {
      success: true,
      message: 'User retrieved successfully',
      data: user as UserResponse,
    };
  }

  /**
   * Find user by email (for authentication)
   */
  async findByEmail(email: string): Promise<UserResponse | null> {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });
    return user as UserResponse | null;
  }

  /**
   * Update user information
   */
  async update(
    id: string,
    updateUserDto: UpdateUserDto,
  ): Promise<ApiResponse<UserResponse>> {
    // Check if user exists
    await this.findOne(id);

    // If password is being updated, hash it
    if (updateUserDto.password) {
      updateUserDto.password = await bcrypt.hash(updateUserDto.password, 12);
    }

    const user = await this.prisma.user.update({
      where: { id },
      data: updateUserDto,
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        licenseNumber: true,
        dateOfBirth: true,
        address: true,
        city: true,
        state: true,
        zipCode: true,
        country: true,
        isVerified: true,
        profileImageUrl: true,
        licenseDocumentUrl: true,
      },
    });

    return {
      success: true,
      message: 'User updated successfully',
      data: user as UserResponse,
    };
  }

  /**
   * Update user profile (including image URLs)
   */
  async updateProfile(
    id: string,
    updateProfileDto: UpdateProfileDto,
  ): Promise<ApiResponse<UserResponse>> {
    // Check if user exists
    await this.findOne(id);

    const user = await this.prisma.user.update({
      where: { id },
      data: updateProfileDto,
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        licenseNumber: true,
        dateOfBirth: true,
        address: true,
        city: true,
        state: true,
        zipCode: true,
        country: true,
        isVerified: true,
        profileImageUrl: true,
        licenseDocumentUrl: true,
      },
    });

    return {
      success: true,
      message: 'Profile updated successfully',
      data: user as UserResponse,
    };
  }

  /**
   * Delete a user (soft delete by setting isActive to false)
   */
  async remove(
    id: string,
  ): Promise<
    ApiResponse<Pick<UserResponse, 'id' | 'email' | 'name' | 'isActive'>>
  > {
    // Check if user exists
    await this.findOne(id);

    // Soft delete by setting isActive to false
    const user = await this.prisma.user.update({
      where: { id },
      data: { isActive: false },
      select: {
        id: true,
        email: true,
        name: true,
        isActive: true,
      },
    });

    return {
      success: true,
      message: 'User deleted successfully',
      data: user as Pick<UserResponse, 'id' | 'email' | 'name' | 'isActive'>,
    };
  }

  /**
   * Permanently delete a user (hard delete from database)
   */
  async deletePermanently(
    id: string,
  ): Promise<ApiResponse<Pick<UserResponse, 'id' | 'email' | 'name'>>> {
    // Check if user exists
    await this.findOne(id);

    // Permanently delete the user
    const user = await this.prisma.user.delete({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
      },
    });

    return {
      success: true,
      message: 'User permanently deleted',
      data: user as Pick<UserResponse, 'id' | 'email' | 'name'>,
    };
  }

  /**
   * Get user profile (includes customer details if applicable)
   */
  async getProfile(id: string): Promise<ApiResponse<UserProfileResponse>> {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        // Customer-specific fields
        licenseNumber: true,
        dateOfBirth: true,
        address: true,
        city: true,
        state: true,
        zipCode: true,
        country: true,
        isVerified: true,
        profileImageUrl: true,
        licenseDocumentUrl: true,
        // Include related data
        bookings: {
          select: {
            id: true,
            startDate: true,
            endDate: true,
            totalPrice: true,
            status: true,
            vehicle: {
              select: {
                id: true,
                make: true,
                model: true,
                year: true,
                licensePlate: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: 5, // Get last 5 bookings
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return {
      success: true,
      message: 'User profile retrieved successfully',
      data: user as UserProfileResponse,
    };
  }

  /**
   * Complete user profile for car rental
   */
  async completeProfile(
    id: string,
    completeProfileDto: CompleteProfileDto,
  ): Promise<ApiResponse<UserResponse>> {
    // Check if user exists
    await this.findOne(id);

    const user = await this.prisma.user.update({
      where: { id },
      data: completeProfileDto,
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        licenseNumber: true,
        dateOfBirth: true,
        address: true,
        city: true,
        state: true,
        zipCode: true,
        country: true,
        isVerified: true,
      },
    });

    return {
      success: true,
      message: 'User profile completed successfully',
      data: user as UserResponse,
    };
  }
}
