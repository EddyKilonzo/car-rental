import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MailerService } from '../mailer/mailer.service';
import { VehiclesService } from '../vehicles/vehicles.service';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { User, Vehicle } from '@prisma/client';

@Injectable()
export class AgentService {
  constructor(
    private prisma: PrismaService,
    private mailerService: MailerService,
    private vehiclesService: VehiclesService,
  ) {}

  /**
   * Apply for agent role - creates an application but doesn't change role yet
   * @param userId
   * @returns User with application status
   */
  async applyForAgent(userId: string): Promise<User> {
    try {
      // check if user exists
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        throw new Error(`User with ID ${userId} not found`);
      }

      // check if user is already an agent
      if (user.role === 'AGENT') {
        throw new Error(`User with ID ${userId} is already an agent`);
      }

      // check if user already has a pending application
      const existingApplication = await this.prisma.agentApplication.findFirst({
        where: {
          userId: userId,
          status: 'PENDING',
        },
      });

      if (existingApplication) {
        throw new Error(
          `User with ID ${userId} already has a pending application`,
        );
      }

      // create new application
      const application = await this.prisma.agentApplication.create({
        data: {
          userId: userId,
          status: 'PENDING',
        },
      });

      // Send application confirmation email
      try {
        await this.mailerService.sendAgentApplicationEmail({
          name: user.name,
          email: user.email,
          applicationId: application.id,
          applicationDate: application.appliedAt.toLocaleDateString(),
        });
      } catch (emailError) {
        console.error('Failed to send agent application email:', emailError);
        // Don't fail application if email fails
      }

      return user;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to apply for agent: ${error.message}`);
      }
      throw new Error('Failed to apply for agent: Unknown error occurred');
    }
  }

  /**
   * Get agent application status for a user
   * @param userId
   * @returns Application status information
   */
  async getApplicationStatus(userId: string): Promise<{
    hasApplied: boolean;
    status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'NOT_APPLIED';
    message?: string;
  }> {
    try {
      // check if user exists
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        throw new Error(`User with ID ${userId} not found`);
      }

      // If user is already an agent, they were approved
      if (user.role === 'AGENT') {
        return {
          hasApplied: true,
          status: 'APPROVED',
          message:
            'Your agent application has been approved! You can now post vehicles.',
        };
      }

      // Check for existing application
      const application = await this.prisma.agentApplication.findFirst({
        where: { userId: userId },
        orderBy: { appliedAt: 'desc' },
      });

      if (application) {
        switch (application.status) {
          case 'PENDING':
            return {
              hasApplied: true,
              status: 'PENDING',
              message:
                'Your agent application is pending review by an administrator.',
            };
          case 'REJECTED':
            return {
              hasApplied: true,
              status: 'REJECTED',
              message:
                application.reason ||
                'Your agent application has been rejected.',
            };
          default:
            return {
              hasApplied: true,
              status: 'PENDING',
              message: 'Your agent application is being processed.',
            };
        }
      }

      return {
        hasApplied: false,
        status: 'NOT_APPLIED',
        message: 'You have not applied to become an agent yet.',
      };
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to get application status: ${error.message}`);
      }
      throw new Error(
        'Failed to get application status: Unknown error occurred',
      );
    }
  }

  /**
   * Approve agent application - changes role from CUSTOMER to AGENT
   * @param userId
   * @returns User with updated role
   */
  async approveAgentApplication(userId: string): Promise<User> {
    try {
      // check if user exists
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        throw new Error(`User with ID ${userId} not found`);
      }

      // check if user is already an agent
      if (user.role === 'AGENT') {
        throw new Error(`User with ID ${userId} is already an agent`);
      }

      // check if user is a customer (only customers can be approved as agents)
      if (user.role !== 'CUSTOMER') {
        throw new Error(
          `User with ID ${userId} can only be approved as agents`,
        );
      }

      // check if there's a pending application
      const application = await this.prisma.agentApplication.findFirst({
        where: {
          userId: userId,
          status: 'PENDING',
        },
      });

      if (!application) {
        throw new Error(
          `No pending application found for user with ID ${userId}`,
        );
      }

      // Update application status and approve user
      await this.prisma.$transaction([
        this.prisma.agentApplication.update({
          where: { id: application.id },
          data: {
            status: 'APPROVED',
            reviewedAt: new Date(),
          },
        }),
        this.prisma.user.update({
          where: { id: userId },
          data: {
            role: 'AGENT',
            isVerified: true,
          },
        }),
      ]);

      // Send approval email
      try {
        await this.mailerService.sendAgentApplicationResponse({
          name: user.name,
          email: user.email,
          status: 'Approved',
        });
      } catch (emailError) {
        console.error('Failed to send approval email:', emailError);
        // Don't fail approval if email fails
      }

      return (await this.prisma.user.findUnique({
        where: { id: userId },
      })) as User;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(
          `Failed to approve agent application: ${error.message}`,
        );
      }
      throw new Error(
        'Failed to approve agent application: Unknown error occurred',
      );
    }
  }

  /**
   * Get all pending agent applications
   * @returns List of users who applied to be agents
   */
  async getPendingAgentApplications(): Promise<{
    applications: Array<{
      id: string;
      userId: string;
      status: string;
      createdAt: string;
      user: {
        id: string;
        name: string;
        email: string;
        phone: string | null;
        createdAt: string;
      };
    }>;
  }> {
    try {
      // Get all users with pending applications
      const applications = await this.prisma.agentApplication.findMany({
        where: {
          status: 'PENDING',
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
              createdAt: true,
            },
          },
        },
      });

      return {
        applications: applications.map((app) => ({
          id: app.id,
          userId: app.userId,
          status: app.status,
          createdAt: app.appliedAt.toISOString(),
          user: {
            id: app.user.id,
            name: app.user.name,
            email: app.user.email,
            phone: app.user.phone,
            createdAt: app.user.createdAt.toISOString(),
          },
        })),
      };
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(
          `Failed to get pending agent applications: ${error.message}`,
        );
      }
      throw new Error(
        'Failed to get pending agent applications: Unknown error occurred',
      );
    }
  }

  /**
   * Reject agent application
   * @param userId
   * @param reason Optional reason for rejection
   * @returns User with unchanged role
   */
  async rejectAgentApplication(userId: string, reason?: string): Promise<User> {
    try {
      // check if user exists
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        throw new Error(`User with ID ${userId} not found`);
      }

      // check if user is already an agent
      if (user.role === 'AGENT') {
        throw new Error(`User with ID ${userId} is already an agent`);
      }

      // check if there's a pending application
      const application = await this.prisma.agentApplication.findFirst({
        where: {
          userId: userId,
          status: 'PENDING',
        },
      });

      if (!application) {
        throw new Error(
          `No pending application found for user with ID ${userId}`,
        );
      }

      // Update application status to rejected
      await this.prisma.agentApplication.update({
        where: { id: application.id },
        data: {
          status: 'REJECTED',
          reviewedAt: new Date(),
          reason: reason || 'Application rejected by administrator',
        },
      });

      // Send rejection email
      try {
        await this.mailerService.sendAgentApplicationResponse({
          name: user.name,
          email: user.email,
          status: 'Denied',
          reason: reason || 'Application rejected by administrator',
        });
      } catch (emailError) {
        console.error('Failed to send rejection email:', emailError);
        // Don't fail rejection if email fails
      }

      return user;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to reject agent application: ${error.message}`);
      }
      throw new Error(
        'Failed to reject agent application: Unknown error occurred',
      );
    }
  }

  /**
   * Remove agent role and demote user back to customer
   * @param userId
   * @returns User with updated role
   */
  async removeAgentRole(userId: string): Promise<User> {
    try {
      // check if user exists
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        throw new Error(`User with ID ${userId} not found`);
      }

      // check if user is actually an agent
      if (user.role !== 'AGENT') {
        throw new Error(
          `User with ID ${userId} is not an agent and cannot be demoted`,
        );
      }

      // demote by changing role from AGENT to CUSTOMER
      return await this.prisma.user.update({
        where: { id: userId },
        data: {
          role: 'CUSTOMER',
        },
      });
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to remove agent role: ${error.message}`);
      }
      throw new Error('Failed to remove agent role: Unknown error occurred');
    }
  }

  /**
   * Get all current agents
   * @returns List of all users with AGENT role
   */
  async getAllAgents(): Promise<
    Pick<User, 'id' | 'name' | 'email' | 'phone' | 'createdAt'>[]
  > {
    try {
      return await this.prisma.user.findMany({
        where: {
          role: 'AGENT',
        },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          createdAt: true,
        },
      });
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to get all agents: ${error.message}`);
      }
      throw new Error('Failed to get all agents: Unknown error occurred');
    }
  }

  /**
   * Agent post vehicle
   * @param userId
   * @param vehicleData
   * @returns Newly created vehicle
   */
  async postVehicle(
    userId: string,
    vehicleData: CreateVehicleDto,
  ): Promise<Vehicle> {
    try {
      console.log('Received vehicle data:', vehicleData);
      console.log('mainImageUrl value:', vehicleData.mainImageUrl);
      console.log('mainImageUrl type:', typeof vehicleData.mainImageUrl);

      // check if user exists and is an agent
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        throw new Error(`User with ID ${userId} not found`);
      }

      // check if user is an agent
      if (user.role !== 'AGENT') {
        throw new Error(
          `User with ID ${userId} is not an agent and cannot post vehicles`,
        );
      }

      // check if license plate already exists
      const existingLicensePlate = await this.prisma.vehicle.findUnique({
        where: { licensePlate: vehicleData.licensePlate },
      });

      if (existingLicensePlate) {
        throw new Error(
          `Vehicle with license plate ${vehicleData.licensePlate} already exists`,
        );
      }

      // check if VIN already exists
      const existingVin = await this.prisma.vehicle.findUnique({
        where: { vin: vehicleData.vin },
      });

      if (existingVin) {
        throw new Error(`Vehicle with VIN ${vehicleData.vin} already exists`);
      }

      // create the vehicle
      const createdVehicle = await this.prisma.vehicle.create({
        data: {
          ...vehicleData,
          userId: userId,
          features: vehicleData.features || [],
        },
      });

      console.log('Created vehicle:', createdVehicle);
      console.log('Created vehicle mainImageUrl:', createdVehicle.mainImageUrl);

      return createdVehicle;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to post vehicle: ${error.message}`);
      }
      throw new Error('Failed to post vehicle: Unknown error occurred');
    }
  }

  /**
   * Get all vehicles posted by a specific agent
   * @param userId
   * @returns List of vehicles posted by the agent
   */
  async getAgentVehicles(userId: string): Promise<Vehicle[]> {
    try {
      // check if user exists and is an agent
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        throw new Error(`User with ID ${userId} not found`);
      }

      if (user.role !== 'AGENT') {
        throw new Error(`User with ID ${userId} is not an agent`);
      }

      return await this.prisma.vehicle.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
      });
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to get agent vehicles: ${error.message}`);
      }
      throw new Error('Failed to get agent vehicles: Unknown error occurred');
    }
  }

  /**
   * Get all vehicles posted by all agents
   * @returns List of all vehicles posted by agents
   */
  async getAllAgentVehicles(): Promise<Vehicle[]> {
    try {
      return await this.prisma.vehicle.findMany({
        where: {
          userId: { not: undefined },
        },
        orderBy: { createdAt: 'desc' },
      });
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to get all agent vehicles: ${error.message}`);
      }
      throw new Error(
        'Failed to get all agent vehicles: Unknown error occurred',
      );
    }
  }

  /**
   * DELETE VEHICLE(AGENT)
   * @param userId
   * @param vehicleId
   * @returns Deleted vehicle
   */
  async deleteVehicle(userId: string, vehicleId: string): Promise<Vehicle> {
    try {
      // check if user exists and is an agent
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        throw new Error(`User with ID ${userId} not found`);
      }

      // check if user is an agent
      if (user.role !== 'AGENT') {
        throw new Error(
          `User with ID ${userId} is not an agent and cannot delete vehicles`,
        );
      }

      // check if vehicle exists and belongs to the agent
      const vehicle = await this.prisma.vehicle.findFirst({
        where: {
          id: vehicleId,
          userId: userId,
        },
      });

      if (!vehicle) {
        throw new Error(
          `Vehicle with ID ${vehicleId} not found or does not belong to the agent`,
        );
      }

      // delete the vehicle
      return await this.prisma.vehicle.delete({
        where: { id: vehicleId },
      });
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to delete vehicle: ${error.message}`);
      }
      throw new Error('Failed to delete vehicle: Unknown error occurred');
    }
  }

  /**
   * Update vehicle details (AGENT)
   * @param userId
   * @param vehicleId
   * @param vehicleData
   * @returns Updated vehicle
   */
  async updateVehicle(
    userId: string,
    vehicleId: string,
    vehicleData: CreateVehicleDto,
  ): Promise<Vehicle> {
    try {
      // check if user exists and is an agent
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
      });
      if (!user) {
        throw new Error(`User with ID ${userId} not found`);
      }

      // check if user is an agent
      if (user.role !== 'AGENT') {
        throw new Error(
          `User with ID ${userId} is not an agent and cannot update vehicles`,
        );
      }

      // check if vehicle exists and belongs to the agent
      const vehicle = await this.prisma.vehicle.findFirst({
        where: {
          id: vehicleId,
          userId: userId,
        },
      });

      if (!vehicle) {
        throw new Error(
          `Vehicle with ID ${vehicleId} not found or does not belong to the agent`,
        );
      }

      // check if license plate already exists (excluding current vehicle)
      if (vehicleData.licensePlate !== vehicle.licensePlate) {
        const existingLicensePlate = await this.prisma.vehicle.findUnique({
          where: { licensePlate: vehicleData.licensePlate },
        });

        if (existingLicensePlate) {
          throw new Error(
            `Vehicle with license plate ${vehicleData.licensePlate} already exists`,
          );
        }
      }

      // check if VIN already exists (excluding current vehicle)
      if (vehicleData.vin !== vehicle.vin) {
        const existingVin = await this.prisma.vehicle.findUnique({
          where: { vin: vehicleData.vin },
        });

        if (existingVin) {
          throw new Error(`Vehicle with VIN ${vehicleData.vin} already exists`);
        }
      }

      // update the vehicle
      return await this.prisma.vehicle.update({
        where: { id: vehicleId },
        data: vehicleData,
      });
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to update vehicle: ${error.message}`);
      }
      throw new Error('Failed to update vehicle: Unknown error occurred');
    }
  }

  /**
   * Get vehicle details by ID (AGENT)
   * @param vehicleId
   * @returns Vehicle details
   */
  async getVehicleDetails(vehicleId: string): Promise<Vehicle> {
    try {
      const vehicle = await this.prisma.vehicle.findUnique({
        where: { id: vehicleId },
      });
      if (!vehicle) {
        throw new Error(`Vehicle with ID ${vehicleId} not found`);
      }
      return vehicle;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to get vehicle details: ${error.message}`);
      }
      throw new Error('Failed to get vehicle details: Unknown error occurred');
    }
  }

  /**
   * Get bookings for an agent's vehicles
   * @param userId
   * @returns Agent bookings
   */
  async getAgentBookings(userId: string) {
    try {
      console.log(`=== GETTING BOOKINGS FOR AGENT ${userId} ===`);

      const bookings = await this.prisma.booking.findMany({
        where: {
          vehicle: {
            userId: userId,
          },
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          vehicle: {
            select: {
              id: true,
              make: true,
              model: true,
              year: true,
              licensePlate: true,
              mainImageUrl: true,
              status: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      console.log(`Found ${bookings.length} bookings for agent`);
      bookings.forEach((booking) => {
        console.log(
          `Booking ${booking.id}: ${booking.vehicle.make} ${booking.vehicle.model} - Status: ${booking.status}, Vehicle Status: ${booking.vehicle.status}`,
        );
      });
      console.log(`=== END AGENT BOOKINGS ===`);

      return {
        success: true,
        data: bookings,
      };
    } catch (error) {
      throw new Error(
        `Failed to get agent bookings: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  /**
   * Get reviews for an agent's vehicles
   * @param userId
   * @returns Agent reviews
   */
  async getAgentReviews(userId: string) {
    try {
      const reviews = await this.prisma.review.findMany({
        where: {
          booking: {
            vehicle: {
              userId: userId,
            },
          },
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
                  year: true,
                  mainImageUrl: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      return {
        success: true,
        data: reviews,
      };
    } catch (error) {
      throw new Error(
        `Failed to get agent reviews: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  /**
   * Approve a booking (Agent only)
   * @param userId
   * @param bookingId
   * @returns Updated booking
   */
  async approveBooking(userId: string, bookingId: string) {
    try {
      // Check if booking exists and belongs to agent's vehicle
      const booking = await this.prisma.booking.findFirst({
        where: {
          id: bookingId,
          vehicle: {
            userId: userId,
          },
        },
      });

      if (!booking) {
        throw new Error('Booking not found or access denied');
      }

      if (booking.status !== 'PENDING') {
        throw new Error('Can only approve pending bookings');
      }

      // Use vehiclesService to update booking status (this will trigger email)
      const updatedBooking = await this.vehiclesService.updateBookingStatus(
        userId,
        bookingId,
        'CONFIRMED',
      );

      return {
        success: true,
        data: updatedBooking,
        message: 'Booking approved successfully',
      };
    } catch (error) {
      throw new Error(
        `Failed to approve booking: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  /**
   * Decline a booking (Agent only)
   * @param userId
   * @param bookingId
   * @returns Updated booking
   */
  async declineBooking(userId: string, bookingId: string) {
    try {
      // Check if booking exists and belongs to agent's vehicle
      const booking = await this.prisma.booking.findFirst({
        where: {
          id: bookingId,
          vehicle: {
            userId: userId,
          },
        },
      });

      if (!booking) {
        throw new Error('Booking not found or access denied');
      }

      if (booking.status !== 'PENDING') {
        throw new Error('Can only decline pending bookings');
      }

      const updatedBooking = await this.prisma.booking.update({
        where: { id: bookingId },
        data: { status: 'CANCELLED' },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          vehicle: {
            select: {
              id: true,
              make: true,
              model: true,
            },
          },
        },
      });

      return {
        success: true,
        data: updatedBooking,
        message: 'Booking declined successfully',
      };
    } catch (error) {
      throw new Error(
        `Failed to decline booking: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  /**
   * Mark booking as active (Agent only)
   * @param userId
   * @param bookingId
   * @returns Updated booking
   */
  async markBookingAsActive(userId: string, bookingId: string) {
    try {
      // Check if booking exists and belongs to agent's vehicle
      const booking = await this.prisma.booking.findFirst({
        where: {
          id: bookingId,
          vehicle: {
            userId: userId,
          },
        },
      });

      if (!booking) {
        throw new Error('Booking not found or access denied');
      }

      if (booking.status !== 'CONFIRMED') {
        throw new Error('Can only activate confirmed bookings');
      }

      const updatedBooking = await this.prisma.booking.update({
        where: { id: bookingId },
        data: { status: 'ACTIVE' },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          vehicle: {
            select: {
              id: true,
              make: true,
              model: true,
            },
          },
        },
      });

      return {
        success: true,
        data: updatedBooking,
        message: 'Booking marked as active successfully',
      };
    } catch (error) {
      throw new Error(
        `Failed to mark booking as active: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  /**
   * Mark booking as completed (Agent only)
   * @param userId
   * @param bookingId
   * @returns Updated booking
   */
  async markBookingAsCompleted(userId: string, bookingId: string) {
    try {
      console.log(`=== MARKING BOOKING ${bookingId} AS COMPLETED ===`);

      // Check if booking exists and belongs to agent's vehicle
      const booking = await this.prisma.booking.findFirst({
        where: {
          id: bookingId,
          vehicle: {
            userId: userId,
          },
        },
        include: {
          vehicle: true,
        },
      });

      if (!booking) {
        throw new Error('Booking not found or access denied');
      }

      console.log(
        `Found booking: ${booking.id}, vehicle: ${booking.vehicleId}, current status: ${booking.status}`,
      );
      console.log(
        `Vehicle details: ${booking.vehicle.make} ${booking.vehicle.model}, current status: ${booking.vehicle.status}, isActive: ${booking.vehicle.isActive}`,
      );

      if (booking.status !== 'ACTIVE') {
        throw new Error('Can only complete active bookings');
      }

      // Update booking status to COMPLETED
      const updatedBooking = await this.prisma.booking.update({
        where: { id: bookingId },
        data: { status: 'COMPLETED' },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          vehicle: {
            select: {
              id: true,
              make: true,
              model: true,
            },
          },
        },
      });

      console.log(`Booking status updated to: ${updatedBooking.status}`);

      // Update vehicle status back to AVAILABLE and ensure it's active
      const updatedVehicle = await this.prisma.vehicle.update({
        where: { id: booking.vehicleId },
        data: {
          status: 'AVAILABLE',
          isActive: true,
        },
      });

      console.log(
        `Updated vehicle ${booking.vehicleId} status to ${updatedVehicle.status} and isActive to ${updatedVehicle.isActive}`,
      );

      return {
        success: true,
        data: updatedBooking,
        message: 'Booking marked as completed successfully',
      };
    } catch (error) {
      console.error(
        `Error in markBookingAsCompleted: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
      throw new Error(
        `Failed to mark booking as completed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }
}
