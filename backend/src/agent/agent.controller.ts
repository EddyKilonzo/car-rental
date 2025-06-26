import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
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
  ApiParam,
} from '@nestjs/swagger';
import { AgentService } from './agent.service';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

interface RequestWithUser extends Request {
  user: {
    id: string;
    role: string;
  };
}

@ApiTags('Agent Management')
@ApiBearerAuth()
@Controller('agent')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AgentController {
  constructor(private readonly agentService: AgentService) {}

  // Agent Application Management (Admin only)
  @Post('apply')
  @ApiOperation({ summary: 'Apply to become an agent (Customer only)' })
  @ApiResponse({
    status: 201,
    description: 'Application submitted successfully',
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Only customers can apply',
  })
  @Roles(UserRole.CUSTOMER)
  async applyForAgent(@Request() req: RequestWithUser) {
    try {
      const userId = req.user.id;
      return await this.agentService.applyForAgent(userId);
    } catch (error) {
      throw new HttpException(
        error instanceof Error ? error.message : 'Unknown error',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Get('applications/pending')
  @ApiOperation({ summary: 'Get pending agent applications (Admin only)' })
  @ApiResponse({ status: 200, description: 'List of pending applications' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Only admins can view applications',
  })
  @Roles(UserRole.ADMIN)
  async getPendingApplications() {
    try {
      return await this.agentService.getPendingAgentApplications();
    } catch (error) {
      throw new HttpException(
        error instanceof Error ? error.message : 'Unknown error',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Put('applications/:userId/approve')
  @ApiOperation({ summary: 'Approve agent application (Admin only)' })
  @ApiParam({ name: 'userId', description: 'User ID to approve' })
  @ApiResponse({
    status: 200,
    description: 'Application approved successfully',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Only admins can approve applications',
  })
  @ApiResponse({ status: 404, description: 'User not found' })
  @Roles(UserRole.ADMIN)
  async approveApplication(@Param('userId') userId: string) {
    try {
      return await this.agentService.approveAgentApplication(userId);
    } catch (error) {
      throw new HttpException(
        error instanceof Error ? error.message : 'Unknown error',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Put('applications/:userId/reject')
  @ApiOperation({ summary: 'Reject agent application (Admin only)' })
  @ApiParam({ name: 'userId', description: 'User ID to reject' })
  @ApiResponse({
    status: 200,
    description: 'Application rejected successfully',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Only admins can reject applications',
  })
  @ApiResponse({ status: 404, description: 'User not found' })
  @Roles(UserRole.ADMIN)
  async rejectApplication(@Param('userId') userId: string) {
    try {
      return await this.agentService.rejectAgentApplication(userId);
    } catch (error) {
      throw new HttpException(
        error instanceof Error ? error.message : 'Unknown error',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Put('applications/:userId/remove')
  @ApiOperation({ summary: 'Remove agent role (Admin only)' })
  @ApiParam({
    name: 'userId',
    description: 'User ID to remove agent role from',
  })
  @ApiResponse({ status: 200, description: 'Agent role removed successfully' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Only admins can remove agent roles',
  })
  @ApiResponse({ status: 404, description: 'User not found' })
  @Roles(UserRole.ADMIN)
  async removeAgentRole(@Param('userId') userId: string) {
    try {
      return await this.agentService.removeAgentRole(userId);
    } catch (error) {
      throw new HttpException(
        error instanceof Error ? error.message : 'Unknown error',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Get('all')
  @ApiOperation({ summary: 'Get all agents (Admin only)' })
  @ApiResponse({ status: 200, description: 'List of all agents' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Only admins can view all agents',
  })
  @Roles(UserRole.ADMIN)
  async getAllAgents() {
    try {
      return await this.agentService.getAllAgents();
    } catch (error) {
      throw new HttpException(
        error instanceof Error ? error.message : 'Unknown error',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  // Vehicle Management (Agent only)
  @Post('vehicles')
  @ApiOperation({ summary: 'Post a new vehicle (Agent only)' })
  @ApiResponse({ status: 201, description: 'Vehicle posted successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Only agents can post vehicles',
  })
  @Roles(UserRole.AGENT)
  async postVehicle(
    @Request() req: RequestWithUser,
    @Body() vehicleData: CreateVehicleDto,
  ) {
    try {
      const userId = req.user.id;
      return await this.agentService.postVehicle(userId, vehicleData);
    } catch (error) {
      throw new HttpException(
        error instanceof Error ? error.message : 'Unknown error',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Get('vehicles')
  @ApiOperation({ summary: 'Get my vehicles (Agent only)' })
  @ApiResponse({ status: 200, description: 'List of agent vehicles' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Only agents can view their vehicles',
  })
  @Roles(UserRole.AGENT)
  async getMyVehicles(@Request() req: RequestWithUser) {
    try {
      const userId = req.user.id;
      return await this.agentService.getAgentVehicles(userId);
    } catch (error) {
      throw new HttpException(
        error instanceof Error ? error.message : 'Unknown error',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Get('vehicles/all')
  @ApiOperation({ summary: 'Get all agent vehicles (Admin only)' })
  @ApiResponse({ status: 200, description: 'List of all agent vehicles' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Only admins can view all agent vehicles',
  })
  @Roles(UserRole.ADMIN)
  async getAllAgentVehicles() {
    try {
      return await this.agentService.getAllAgentVehicles();
    } catch (error) {
      throw new HttpException(
        error instanceof Error ? error.message : 'Unknown error',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Get('vehicles/:vehicleId')
  @ApiOperation({ summary: 'Get vehicle details (Agent/Admin only)' })
  @ApiParam({ name: 'vehicleId', description: 'Vehicle ID' })
  @ApiResponse({ status: 200, description: 'Vehicle details' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Only agents and admins can view vehicle details',
  })
  @ApiResponse({ status: 404, description: 'Vehicle not found' })
  @Roles(UserRole.AGENT, UserRole.ADMIN)
  async getVehicleDetails(@Param('vehicleId') vehicleId: string) {
    try {
      return await this.agentService.getVehicleDetails(vehicleId);
    } catch (error) {
      throw new HttpException(
        error instanceof Error ? error.message : 'Unknown error',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Put('vehicles/:vehicleId')
  @ApiOperation({ summary: 'Update vehicle (Agent only)' })
  @ApiParam({ name: 'vehicleId', description: 'Vehicle ID' })
  @ApiResponse({ status: 200, description: 'Vehicle updated successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Only agents can update vehicles',
  })
  @ApiResponse({ status: 404, description: 'Vehicle not found' })
  @Roles(UserRole.AGENT)
  async updateVehicle(
    @Request() req: RequestWithUser,
    @Param('vehicleId') vehicleId: string,
    @Body() vehicleData: CreateVehicleDto,
  ) {
    try {
      const userId = req.user.id;
      return await this.agentService.updateVehicle(
        userId,
        vehicleId,
        vehicleData,
      );
    } catch (error) {
      throw new HttpException(
        error instanceof Error ? error.message : 'Unknown error',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Delete('vehicles/:vehicleId')
  @ApiOperation({ summary: 'Delete vehicle (Agent only)' })
  @ApiParam({ name: 'vehicleId', description: 'Vehicle ID' })
  @ApiResponse({ status: 200, description: 'Vehicle deleted successfully' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Only agents can delete vehicles',
  })
  @ApiResponse({ status: 404, description: 'Vehicle not found' })
  @Roles(UserRole.AGENT)
  async deleteVehicle(
    @Request() req: RequestWithUser,
    @Param('vehicleId') vehicleId: string,
  ) {
    try {
      const userId = req.user.id;
      return await this.agentService.deleteVehicle(userId, vehicleId);
    } catch (error) {
      throw new HttpException(
        error instanceof Error ? error.message : 'Unknown error',
        HttpStatus.BAD_REQUEST,
      );
    }
  }
}
