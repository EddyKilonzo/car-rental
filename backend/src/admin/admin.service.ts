import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { UserRole, VehicleStatus } from '@prisma/client';

interface UserWhereClause {
  role?: UserRole;
  OR?: Array<{
    name?: { contains: string; mode: 'insensitive' };
    email?: { contains: string; mode: 'insensitive' };
  }>;
}

interface VehicleWhereClause {
  status?: VehicleStatus;
  OR?: Array<{
    make?: { contains: string; mode: 'insensitive' };
    model?: { contains: string; mode: 'insensitive' };
    licensePlate?: { contains: string; mode: 'insensitive' };
  }>;
}

interface ReviewWhereClause {
  rating?: {
    gte?: number;
    lte?: number;
  };
}

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  async getSystemStats() {
    try {
      const [
        totalUsers,
        totalVehicles,
        totalBookings,
        totalReviews,
        activeBookings,
        availableVehicles,
        rentedVehicles,
        maintenanceVehicles,
        pendingBookings,
        completedBookings,
        totalRevenue,
        averageRating,
      ] = await Promise.all([
        this.prisma.user.count(),
        this.prisma.vehicle.count(),
        this.prisma.booking.count(),
        this.prisma.review.count(),
        this.prisma.booking.count({
          where: { status: { in: ['CONFIRMED', 'ACTIVE'] } },
        }),
        this.prisma.vehicle.count({
          where: { status: 'AVAILABLE' },
        }),
        this.prisma.vehicle.count({
          where: { status: 'RENTED' },
        }),
        this.prisma.vehicle.count({
          where: { status: 'MAINTENANCE' },
        }),
        this.prisma.booking.count({
          where: { status: 'PENDING' },
        }),
        this.prisma.booking.count({
          where: { status: 'COMPLETED' },
        }),
        this.prisma.booking.aggregate({
          where: { status: 'COMPLETED' },
          _sum: { totalPrice: true },
        }),
        this.prisma.review.aggregate({
          _avg: { rating: true },
        }),
      ]);

      return {
        users: {
          total: totalUsers,
          customers: await this.prisma.user.count({
            where: { role: 'CUSTOMER' },
          }),
          agents: await this.prisma.user.count({ where: { role: 'AGENT' } }),
          admins: await this.prisma.user.count({ where: { role: 'ADMIN' } }),
        },
        vehicles: {
          total: totalVehicles,
          available: availableVehicles,
          rented: rentedVehicles,
          maintenance: maintenanceVehicles,
          outOfService: await this.prisma.vehicle.count({
            where: { status: 'OUT_OF_SERVICE' },
          }),
        },
        bookings: {
          total: totalBookings,
          active: activeBookings,
          pending: pendingBookings,
          completed: completedBookings,
          cancelled: await this.prisma.booking.count({
            where: { status: 'CANCELLED' },
          }),
        },
        reviews: {
          total: totalReviews,
          averageRating: averageRating._avg.rating || 0,
        },
        revenue: {
          total: totalRevenue._sum.totalPrice || 0,
          averagePerBooking:
            totalRevenue._sum.totalPrice && completedBookings > 0
              ? totalRevenue._sum.totalPrice / completedBookings
              : 0,
        },
      };
    } catch (error) {
      throw new Error(
        `Failed to get system stats: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }
  /**
   * Get all users with pagination and filtering
   * @param page
   * @param limit
   * @param role
   * @param search
   * @returns
   */

  async getAllUsers(
    page: number = 1,
    limit: number = 10,
    role?: UserRole,
    search?: string,
  ) {
    try {
      const skip = (page - 1) * limit;
      const where: UserWhereClause = {};

      if (role) {
        where.role = role;
      }

      if (search) {
        where.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
        ];
      }

      const [users, total] = await Promise.all([
        this.prisma.user.findMany({
          where,
          skip,
          take: limit,
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            role: true,
            isActive: true,
            isVerified: true,
            createdAt: true,
            updatedAt: true,
            profileImageUrl: true,
            _count: {
              select: {
                bookings: true,
                reviews: true,
                vehicles: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        }),
        this.prisma.user.count({ where }),
      ]);

      return {
        users,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      throw new Error(
        `Failed to get users: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  /**
   * Get user details by ID
   * @param userId
   * @returns User details with related data
   */
  async getUserDetails(userId: string) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        include: {
          bookings: {
            include: {
              vehicle: {
                select: {
                  id: true,
                  make: true,
                  model: true,
                  licensePlate: true,
                },
              },
            },
            orderBy: { createdAt: 'desc' },
          },
          reviews: {
            include: {
              booking: {
                include: {
                  vehicle: {
                    select: {
                      id: true,
                      make: true,
                      model: true,
                    },
                  },
                },
              },
            },
            orderBy: { createdAt: 'desc' },
          },
          vehicles: {
            orderBy: { createdAt: 'desc' },
          },
        },
      });

      if (!user) {
        throw new NotFoundException(`User with ID ${userId} not found`);
      }

      return user;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new Error(
        `Failed to get user details: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  /**
   * Update user role
   * @param userId
   * @param role
   * @returns Updated user
   */
  async updateUserRole(userId: string, role: UserRole) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        throw new NotFoundException(`User with ID ${userId} not found`);
      }

      return await this.prisma.user.update({
        where: { id: userId },
        data: { role },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          isActive: true,
          updatedAt: true,
        },
      });
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new Error(
        `Failed to update user role: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  /**
   * Toggle user active status
   * @param userId
   * @returns Updated user
   */
  async toggleUserStatus(userId: string) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        throw new NotFoundException(`User with ID ${userId} not found`);
      }

      return await this.prisma.user.update({
        where: { id: userId },
        data: { isActive: !user.isActive },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          isActive: true,
          updatedAt: true,
        },
      });
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new Error(
        `Failed to toggle user status: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  /**
   * Get all vehicles with pagination and filtering
   * @param page
   * @param limit
   * @param status
   * @param search
   * @returns Paginated vehicles
   */
  async getAllVehicles(
    page: number = 1,
    limit: number = 10,
    status?: VehicleStatus,
    search?: string,
  ) {
    try {
      const skip = (page - 1) * limit;
      const where: VehicleWhereClause = {};

      if (status) {
        where.status = status;
      }

      if (search) {
        where.OR = [
          { make: { contains: search, mode: 'insensitive' } },
          { model: { contains: search, mode: 'insensitive' } },
          { licensePlate: { contains: search, mode: 'insensitive' } },
        ];
      }

      const [vehicles, total] = await Promise.all([
        this.prisma.vehicle.findMany({
          where,
          skip,
          take: limit,
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                role: true,
              },
            },
            _count: {
              select: {
                bookings: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        }),
        this.prisma.vehicle.count({ where }),
      ]);

      return {
        vehicles,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      throw new Error(
        `Failed to get vehicles: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  /**
   * Get vehicle details by ID
   * @param vehicleId
   * @returns Vehicle details with related data
   */
  async getVehicleDetails(vehicleId: string) {
    try {
      const vehicle = await this.prisma.vehicle.findUnique({
        where: { id: vehicleId },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
            },
          },
          bookings: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
              reviews: {
                include: {
                  user: {
                    select: {
                      name: true,
                    },
                  },
                },
              },
            },
            orderBy: { createdAt: 'desc' },
          },
        },
      });

      if (!vehicle) {
        throw new NotFoundException(`Vehicle with ID ${vehicleId} not found`);
      }

      return vehicle;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new Error(
        `Failed to get vehicle details: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  /**
   * Toggle vehicle active status
   * @param vehicleId
   * @returns Updated vehicle
   */
  async toggleVehicleStatus(vehicleId: string) {
    try {
      const vehicle = await this.prisma.vehicle.findUnique({
        where: { id: vehicleId },
      });

      if (!vehicle) {
        throw new NotFoundException(`Vehicle with ID ${vehicleId} not found`);
      }

      return await this.prisma.vehicle.update({
        where: { id: vehicleId },
        data: { isActive: !vehicle.isActive },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new Error(
        `Failed to toggle vehicle status: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  /**
   * Get all reviews with pagination and filtering
   * @param page
   * @param limit
   * @param minRating
   * @param maxRating
   * @returns Paginated reviews
   */
  async getAllReviews(
    page: number = 1,
    limit: number = 10,
    minRating?: number,
    maxRating?: number,
  ) {
    try {
      const skip = (page - 1) * limit;
      const where: ReviewWhereClause = {};

      if (minRating !== undefined || maxRating !== undefined) {
        where.rating = {};
        if (minRating !== undefined) where.rating.gte = minRating;
        if (maxRating !== undefined) where.rating.lte = maxRating;
      }

      const [reviews, total] = await Promise.all([
        this.prisma.review.findMany({
          where,
          skip,
          take: limit,
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            booking: {
              include: {
                vehicle: {
                  select: {
                    id: true,
                    make: true,
                    model: true,
                    licensePlate: true,
                  },
                },
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        }),
        this.prisma.review.count({ where }),
      ]);

      return {
        reviews,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      throw new Error(
        `Failed to get reviews: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  /**
   * Get review statistics
   * @returns Review statistics
   */
  async getReviewStats() {
    try {
      const [totalReviews, averageRating, ratingDistribution, recentReviews] =
        await Promise.all([
          this.prisma.review.count(),
          this.prisma.review.aggregate({
            _avg: { rating: true },
          }),
          this.prisma.review.groupBy({
            by: ['rating'],
            _count: { rating: true },
            orderBy: { rating: 'asc' },
          }),
          this.prisma.review.findMany({
            take: 5,
            include: {
              user: {
                select: {
                  name: true,
                },
              },
              booking: {
                include: {
                  vehicle: {
                    select: {
                      make: true,
                      model: true,
                    },
                  },
                },
              },
            },
            orderBy: { createdAt: 'desc' },
          }),
        ]);

      return {
        totalReviews,
        averageRating: averageRating._avg.rating || 0,
        ratingDistribution,
        recentReviews,
      };
    } catch (error) {
      throw new Error(
        `Failed to get review stats: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  /**
   * Delete a review (Admin only)
   * @param reviewId
   * @returns Deleted review
   */
  async deleteReview(reviewId: string) {
    try {
      const review = await this.prisma.review.findUnique({
        where: { id: reviewId },
      });

      if (!review) {
        throw new NotFoundException(`Review with ID ${reviewId} not found`);
      }

      return await this.prisma.review.delete({
        where: { id: reviewId },
        include: {
          user: {
            select: {
              name: true,
            },
          },
          booking: {
            include: {
              vehicle: {
                select: {
                  make: true,
                  model: true,
                },
              },
            },
          },
        },
      });
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new Error(
        `Failed to delete review: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }
}
