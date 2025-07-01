import {
  Injectable,
  ForbiddenException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { MailerService } from '../mailer/mailer.service';
import {
  Vehicle,
  Booking,
  Review,
  VehicleType,
  FuelType,
  TransmissionType,
  BookingStatus,
} from '@prisma/client';
import { CreateBookingDto } from './dto/create-booking.dto';
import { CreateBookingForCustomerDto } from './dto/create-booking-for-customer.dto';
import { CreateReviewDto } from './dto/create-review.dto';

interface VehicleFilters {
  vehicleType?: VehicleType;
  fuelType?: FuelType;
  transmission?: TransmissionType;
  minPrice?: number;
  maxPrice?: number;
  seats?: number;
  make?: string;
  model?: string;
  minYear?: number;
  maxYear?: number;
}

@Injectable()
export class VehiclesService {
  constructor(
    private prisma: PrismaService,
    private mailerService: MailerService,
  ) {}
  /**
   * Get all available vehicles
   * @returns List of available vehicles
   */

  async getAllVehicles(): Promise<Vehicle[]> {
    try {
      // Get all vehicles to show them in the listing (including booked ones)
      const allVehicles = await this.prisma.vehicle.findMany({
        where: {
          isActive: true, // Only show active vehicles, but include all statuses
        },
        orderBy: { createdAt: 'desc' },
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



      return allVehicles;
    } catch (error) {
      throw new Error(
        `Failed to get vehicles: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }
  /**
   * Get a vehicle by its ID
   * @param vehicleId ID of the vehicle to retrieve
   * @returns The requested vehicle or throws a NotFoundException
   */

  async getVehicleById(vehicleId: string): Promise<Vehicle> {
    try {
      const vehicle = await this.prisma.vehicle.findUnique({
        where: { id: vehicleId },
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
   * Searches for vehicles based on the provided filters.
   * @param filters Vehicle filters to apply.
   * @returns List of vehicles matching the filters.
   */
  async searchVehicles(filters: VehicleFilters): Promise<Vehicle[]> {
    try {
      const whereClause: {
        status: 'AVAILABLE';
        isActive: boolean;
        vehicleType?: VehicleType;
        fuelType?: FuelType;
        transmission?: TransmissionType;
        pricePerDay?: { gte?: number; lte?: number };
        seats?: { gte: number };
        make?: { contains: string; mode: 'insensitive' };
        model?: { contains: string; mode: 'insensitive' };
        year?: { gte?: number; lte?: number };
      } = {
        status: 'AVAILABLE' as const,
        isActive: true,
      };

      if (filters.vehicleType) {
        whereClause['vehicleType'] = filters.vehicleType;
      }

      if (filters.fuelType) {
        whereClause['fuelType'] = filters.fuelType;
      }

      if (filters.transmission) {
        whereClause['transmission'] = filters.transmission;
      }

      if (filters.minPrice) {
        whereClause['pricePerDay'] = { gte: filters.minPrice };
      }

      if (filters.maxPrice) {
        if (whereClause['pricePerDay']) {
          whereClause['pricePerDay']['lte'] = filters.maxPrice;
        } else {
          whereClause['pricePerDay'] = { lte: filters.maxPrice };
        }
      }

      if (filters.seats) {
        whereClause['seats'] = { gte: filters.seats };
      }

      if (filters.make) {
        whereClause['make'] = { contains: filters.make, mode: 'insensitive' };
      }

      if (filters.model) {
        whereClause['model'] = { contains: filters.model, mode: 'insensitive' };
      }

      if (filters.minYear) {
        whereClause['year'] = { gte: filters.minYear };
      }

      if (filters.maxYear) {
        if (whereClause['year']) {
          whereClause['year']['lte'] = filters.maxYear;
        } else {
          whereClause['year'] = { lte: filters.maxYear };
        }
      }

      return await this.prisma.vehicle.findMany({
        where: whereClause,
        orderBy: { createdAt: 'desc' },
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
      throw new Error(
        `Failed to search vehicles: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }
  /**
   * Create a booking for a user
   * @param userId - ID of the user creating the booking
   * @param bookingData - Data for the booking
   * @returns Created booking
   */
  async createBooking(
    userId: string,
    bookingData: CreateBookingDto,
  ): Promise<Booking> {
    try {
      // Check if user exists and is a customer
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        throw new NotFoundException(`User with ID ${userId} not found`);
      }

      if (user.role !== 'CUSTOMER' && user.role !== 'AGENT') {
        throw new ForbiddenException(
          'Only customers and agents can create bookings',
        );
      }

      // Check if vehicle exists and is available
      const vehicle = await this.prisma.vehicle.findUnique({
        where: { id: bookingData.vehicleId },
      });

      if (!vehicle) {
        throw new NotFoundException(
          `Vehicle with ID ${bookingData.vehicleId} not found`,
        );
      }

      if (vehicle.status !== 'AVAILABLE') {
        throw new BadRequestException('Vehicle is not available for booking');
      }

      // Check for date conflicts
      const startDate = new Date(bookingData.startDate);
      const endDate = new Date(bookingData.endDate);

      if (startDate >= endDate) {
        throw new BadRequestException('End date must be after start date');
      }

      if (startDate < new Date()) {
        throw new BadRequestException('Start date cannot be in the past');
      }

      // Check for existing bookings that overlap
      const conflictingBookings = await this.prisma.booking.findMany({
        where: {
          vehicleId: bookingData.vehicleId,
          status: {
            in: ['PENDING', 'CONFIRMED', 'ACTIVE'],
          },
          OR: [
            {
              startDate: {
                lte: endDate,
              },
              endDate: {
                gte: startDate,
              },
            },
          ],
        },
      });

      if (conflictingBookings.length > 0) {
        throw new BadRequestException(
          `Vehicle is already booked for the ${bookingData.startDate} to ${bookingData.endDate} period`,
        );
      }

      // Calculate total price
      const days = Math.ceil(
        (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24),
      );
      const totalPrice = days * vehicle.pricePerDay;

      // Create the booking
      const booking = await this.prisma.booking.create({
        data: {
          userId,
          vehicleId: bookingData.vehicleId,
          startDate,
          endDate,
          pickupLocation: bookingData.pickupLocation,
          returnLocation: bookingData.returnLocation,
          totalPrice,
          notes: bookingData.notes,
        },
        include: {
          vehicle: true,
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      // Update vehicle status to RENTED
      await this.prisma.vehicle.update({
        where: { id: bookingData.vehicleId },
        data: { status: 'RENTED' },
      });

      return booking;
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof ForbiddenException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new Error(
        `Failed to create booking: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  /**
   * Create a booking for a customer (Agent only)
   * @param agentId
   * @param bookingData
   * @returns Created booking
   */
  async createBookingForCustomer(
    agentId: string,
    bookingData: CreateBookingForCustomerDto,
  ): Promise<Booking> {
    try {
      // Check if agent exists and is an agent
      const agent = await this.prisma.user.findUnique({
        where: { id: agentId },
      });

      if (!agent) {
        throw new NotFoundException(`Agent with ID ${agentId} not found`);
      }

      if (agent.role !== 'AGENT') {
        throw new ForbiddenException(
          'Only agents can create bookings for customers',
        );
      }

      // Check if customer exists
      const customer = await this.prisma.user.findUnique({
        where: { id: bookingData.customerId },
      });

      if (!customer) {
        throw new NotFoundException(
          `Customer with ID ${bookingData.customerId} not found`,
        );
      }

      if (customer.role !== 'CUSTOMER') {
        throw new BadRequestException('Can only create bookings for customers');
      }

      // Check if vehicle exists and is available
      const vehicle = await this.prisma.vehicle.findUnique({
        where: { id: bookingData.vehicleId },
      });

      if (!vehicle) {
        throw new NotFoundException(
          `Vehicle with ID ${bookingData.vehicleId} not found`,
        );
      }

      if (vehicle.status !== 'AVAILABLE') {
        throw new BadRequestException('Vehicle is not available for booking');
      }

      // Check for date conflicts
      const startDate = new Date(bookingData.startDate);
      const endDate = new Date(bookingData.endDate);

      if (startDate >= endDate) {
        throw new BadRequestException('End date must be after start date');
      }

      if (startDate < new Date()) {
        throw new BadRequestException('Start date cannot be in the past');
      }

      // Check for existing bookings that overlap
      const conflictingBookings = await this.prisma.booking.findMany({
        where: {
          vehicleId: bookingData.vehicleId,
          status: {
            in: ['PENDING', 'CONFIRMED', 'ACTIVE'],
          },
          OR: [
            {
              startDate: {
                lte: endDate,
              },
              endDate: {
                gte: startDate,
              },
            },
          ],
        },
      });

      if (conflictingBookings.length > 0) {
        throw new BadRequestException(
          'Vehicle is already booked for the selected dates',
        );
      }

      // Calculate total price
      const days = Math.ceil(
        (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24),
      );
      const totalPrice = days * vehicle.pricePerDay;

      // Create the booking for the customer
      const booking = await this.prisma.booking.create({
        data: {
          userId: bookingData.customerId, // Book for the customer, not the agent
          vehicleId: bookingData.vehicleId,
          startDate,
          endDate,
          pickupLocation: bookingData.pickupLocation,
          returnLocation: bookingData.returnLocation,
          totalPrice,
          notes: `${bookingData.notes ? bookingData.notes + ' | ' : ''}Booked by agent: ${agent.name} (${agent.email})`,
        },
        include: {
          vehicle: true,
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      // Update vehicle status to RENTED
      await this.prisma.vehicle.update({
        where: { id: bookingData.vehicleId },
        data: { status: 'RENTED' },
      });

      return booking;
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof ForbiddenException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new Error(
        `Failed to create booking for customer: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  /**
   * Get user's bookings
   * @param userId
   * @returns User's bookings
   */
  async getUserBookings(userId: string): Promise<Booking[]> {
    try {
      return await this.prisma.booking.findMany({
        where: { userId },
        include: {
          vehicle: true,
          reviews: {
            select: {
              id: true,
              rating: true,
              comment: true,
              createdAt: true,
              userId: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
    } catch (error) {
      throw new Error(
        `Failed to get user bookings: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  /**
   * Get booking details by ID
   * @param userId
   * @param bookingId
   * @returns Booking details
   */
  async getBookingById(userId: string, bookingId: string): Promise<Booking> {
    try {
      const booking = await this.prisma.booking.findFirst({
        where: {
          id: bookingId,
          userId,
        },
        include: {
          vehicle: true,
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          reviews: true,
        },
      });

      if (!booking) {
        throw new NotFoundException(`Booking with ID ${bookingId} not found`);
      }

      return booking;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new Error(
        `Failed to get booking details: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  /**
   * Cancel a booking
   * @param userId
   * @param bookingId
   * @returns Updated booking
   */
  async cancelBooking(userId: string, bookingId: string): Promise<Booking> {
    try {
      const booking = await this.prisma.booking.findFirst({
        where: {
          id: bookingId,
          userId,
        },
        include: {
          vehicle: true,
        },
      });

      if (!booking) {
        throw new NotFoundException(`Booking with ID ${bookingId} not found`);
      }

      if (booking.status === 'CANCELLED') {
        throw new BadRequestException('Booking is already cancelled');
      }

      if (booking.status === 'COMPLETED') {
        throw new BadRequestException('Cannot cancel a completed booking');
      }

      // Update booking status
      const updatedBooking = await this.prisma.booking.update({
        where: { id: bookingId },
        data: { status: 'CANCELLED' },
        include: {
          vehicle: true,
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      // Update vehicle status back to AVAILABLE
      await this.prisma.vehicle.update({
        where: { id: booking.vehicleId },
        data: { status: 'AVAILABLE' },
      });

      return updatedBooking;
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new Error(
        `Failed to cancel booking: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  /**
   * Create a review for a booking
   * @param userId
   * @param reviewData
   * @returns Created review
   */
  async createReview(
    userId: string,
    reviewData: CreateReviewDto,
  ): Promise<Review> {
    try {
      // Check if user exists
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        throw new NotFoundException(`User with ID ${userId} not found`);
      }

      // Check if booking exists and belongs to user
      const booking = await this.prisma.booking.findFirst({
        where: {
          id: reviewData.bookingId,
          userId,
        },
      });

      if (!booking) {
        throw new NotFoundException(
          `Booking with ID ${reviewData.bookingId} not found`,
        );
      }

      // Check if booking is completed
      if (booking.status !== 'COMPLETED') {
        throw new BadRequestException('Can only review completed bookings');
      }

      // Check if review already exists for this booking
      const existingReview = await this.prisma.review.findFirst({
        where: {
          bookingId: reviewData.bookingId,
          userId,
        },
      });

      if (existingReview) {
        throw new BadRequestException('Review already exists for this booking');
      }

      // Create the review
      return await this.prisma.review.create({
        data: {
          userId,
          bookingId: reviewData.bookingId,
          rating: reviewData.rating,
          comment: reviewData.comment,
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
            },
          },
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
      });
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new Error(
        `Failed to create review: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  /**
   * Get reviews for a vehicle
   * @param vehicleId
   * @returns Vehicle reviews
   */
  async getVehicleReviews(vehicleId: string): Promise<Review[]> {
    try {
      return await this.prisma.review.findMany({
        where: {
          booking: {
            vehicleId,
          },
        },
        include: {
          user: {
            select: {
              name: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
    } catch (error) {
      throw new Error(
        `Failed to get vehicle reviews: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  /**
   * Update booking status (Agent/Admin only)
   * @param userId - ID of the user updating the booking
   * @param bookingId - ID of the booking to update
   * @param status - New status to set
   * @returns Updated booking
   */
  async updateBookingStatus(
    userId: string,
    bookingId: string,
    status: BookingStatus,
  ): Promise<Booking> {
    try {
      // Check if user exists and has permission
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        throw new NotFoundException(`User with ID ${userId} not found`);
      }

      if (user.role !== 'AGENT' && user.role !== 'ADMIN') {
        throw new ForbiddenException(
          'Only agents and admins can update booking status',
        );
      }

      // Check if booking exists
      const booking = await this.prisma.booking.findUnique({
        where: { id: bookingId },
        include: {
          vehicle: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  phone: true,
                },
              },
            },
          },
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      if (!booking) {
        throw new NotFoundException(`Booking with ID ${bookingId} not found`);
      }

      // Check status transition
      if (booking.status === 'CANCELLED') {
        throw new BadRequestException('Cannot update a cancelled booking');
      }

      if (booking.status === 'COMPLETED' && status !== 'COMPLETED') {
        throw new BadRequestException(
          'Cannot change status of a completed booking',
        );
      }

      // Update booking status
      const updatedBooking = await this.prisma.booking.update({
        where: { id: bookingId },
        data: { status },
        include: {
          vehicle: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  phone: true,
                },
              },
            },
          },
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      // Update vehicle status based on booking status
      if (status === 'CONFIRMED' || status === 'ACTIVE') {
        await this.prisma.vehicle.update({
          where: { id: booking.vehicleId },
          data: { status: 'RENTED' },
        });
      } else if (status === 'COMPLETED' || status === 'CANCELLED') {
        await this.prisma.vehicle.update({
          where: { id: booking.vehicleId },
          data: {
            status: 'AVAILABLE',
            isActive: true,
          },
        });
      }

      // Send booking confirmation email when status is CONFIRMED
      if (status === 'CONFIRMED') {
        try {
          await this.mailerService.sendBookingConfirmationEmail({
            customerName: booking.user.name,
            customerEmail: booking.user.email,
            bookingId: booking.id,
            pickupDate: booking.startDate.toLocaleDateString(),
            returnDate: booking.endDate.toLocaleDateString(),
            totalPrice: booking.totalPrice,
            pickupLocation: booking.pickupLocation || 'To be arranged',
            vehicleMake: booking.vehicle.make,
            vehicleModel: booking.vehicle.model,
            vehicleYear: booking.vehicle.year,
            licensePlate: booking.vehicle.licensePlate,
            vehicleColor: booking.vehicle.color,
            fuelType: booking.vehicle.fuelType,
            agentName: booking.vehicle.user.name,
            agentEmail: booking.vehicle.user.email,
            agentPhone: booking.vehicle.user.phone || undefined,
          });
        } catch (emailError) {
          console.error(
            'Failed to send booking confirmation email:',
            emailError,
          );
          // Don't fail booking update if email fails
        }
      }

      return updatedBooking;
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof ForbiddenException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new Error(
        `Failed to update booking status: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  /**
   * Get all bookings (Admin only)
   * @returns All bookings with pagination
   */
  async getAllBookings(
    page: number = 1,
    limit: number = 10,
  ): Promise<{
    bookings: Booking[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  }> {
    try {
      const skip = (page - 1) * limit;

      const [bookings, total] = await Promise.all([
        this.prisma.booking.findMany({
          skip,
          take: limit,
          include: {
            vehicle: true,
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        }),
        this.prisma.booking.count(),
      ]);

      return {
        bookings,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      throw new Error(
        `Failed to get all bookings: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  /**
   * Get bookings by status (Agent/Admin only)
   * @param status - Status to filter by
   * @returns Filtered bookings
   */
  async getBookingsByStatus(status: BookingStatus): Promise<Booking[]> {
    try {
      return await this.prisma.booking.findMany({
        where: { status },
        include: {
          vehicle: true,
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
    } catch (error) {
      throw new Error(
        `Failed to get bookings by status: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  async getUserReviews(userId: string): Promise<Review[]> {
    return this.prisma.review.findMany({
      where: { userId },
      include: {
        booking: {
          include: {
            vehicle: {
              select: {
                id: true,
                make: true,
                model: true,
                year: true,
                mainImageUrl: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
