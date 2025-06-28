import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { User, Vehicle } from '@prisma/client';
import { CreateVehicleDto } from './dto/create-vehicle.dto';

@Injectable()
export class AgentService {
  constructor(private prisma: PrismaService) {}

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

      // track application(later*)######
      return user;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to apply for agent: ${error.message}`);
      }
      throw new Error('Failed to apply for agent: Unknown error occurred');
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

      // approve by changing role from CUSTOMER to AGENT
      return await this.prisma.user.update({
        where: { id: userId },
        data: {
          role: 'AGENT',
        },
      });
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

  async getPendingAgentApplications(): Promise<
    Pick<User, 'id' | 'name' | 'email' | 'phone' | 'createdAt'>[]
  > {
    try {
      // Get all customers who  want to become agents
      return await this.prisma.user.findMany({
        where: {
          role: 'CUSTOMER',
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
   * @returns User with unchanged role
   */
  async rejectAgentApplication(userId: string): Promise<User> {
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

      // track rejection(later*)######
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
      return await this.prisma.vehicle.create({
        data: {
          ...vehicleData,
          userId: userId,
          features: vehicleData.features || [],
        },
      });
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
}
