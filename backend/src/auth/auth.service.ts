import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { AuthResponseDto } from './dto/auth-response.dto';
import { PrismaService } from '../prisma/prisma.service';
import { ApiResponse } from '../common/dto/interfaces/api-response.interface';
import * as bcrypt from 'bcryptjs';
import { User } from '@prisma/client';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private prisma: PrismaService,
  ) {}

  async validateUser(email: string, password: string): Promise<any> {
    // Get user with password for authentication
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (user && (await bcrypt.compare(password, user.password))) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password: _, ...result } = user;
      return result;
    }
    return null;
  }

  async login(loginDto: LoginDto): Promise<ApiResponse<AuthResponseDto>> {
    const user = (await this.validateUser(
      loginDto.email,
      loginDto.password,
    )) as User | null;

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Account is deactivated');
    }

    const payload = { email: user.email, sub: user.id, role: user.role };

    const authResponse: AuthResponseDto = {
      accessToken: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    };

    return {
      success: true,
      message: 'Login successful',
      data: authResponse,
    };
  }

  async register(createUserDto: CreateUserDto): Promise<ApiResponse<AuthResponseDto>> {
    try {
      const userResponse = await this.usersService.create(createUserDto);
      const user = userResponse.data as User;
      if (!user) {
        throw new UnauthorizedException('User creation failed');
      }
      const payload = { email: user.email, sub: user.id, role: user.role };

      const authResponse: AuthResponseDto = {
        accessToken: this.jwtService.sign(payload),
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
      };

      return {
        success: true,
        message: 'Registration successful',
        data: authResponse,
      };
    } catch (error) {
      if (error instanceof ConflictException) {
        throw error;
      }
      throw new UnauthorizedException('Registration failed');
    }
  }
}
