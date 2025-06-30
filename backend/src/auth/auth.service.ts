import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { AuthResponseDto } from './dto/auth-response.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { VerifyResetCodeDto } from './dto/verify-reset-code.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { PrismaService } from '../prisma/prisma.service';
import { MailerService } from '../mailer/mailer.service';
import { ApiResponse } from '../common/dto/interfaces/api-response.interface';
import * as bcrypt from 'bcryptjs';
import { User } from '@prisma/client';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private prisma: PrismaService,
    private mailerService: MailerService,
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
  /**
   * Login user
   * @param loginDto Login credentials
   * @returns JWT access token and user information
   */
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
  /** */

  /**
   * Register user
   * @param createUserDto User registration information
   * @returns JWT access token and user information
   */
  async register(
    createUserDto: CreateUserDto,
  ): Promise<ApiResponse<AuthResponseDto>> {
    try {
      const userResponse = await this.usersService.create(createUserDto);
      const user = userResponse.data as User;
      if (!user) {
        throw new UnauthorizedException('User creation failed');
      }

      // Send welcome email
      try {
        await this.mailerService.sendWelcomeEmail({
          name: user.name,
          email: user.email,
        });
      } catch (emailError) {
        console.error('Failed to send welcome email:', emailError);
        // Don't fail registration if email fails
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
  /**
   * Forgot password - send reset code to user's email
   * @param forgotPasswordDto Email of the user requesting password reset
   * @returns Success message
   */
  async forgotPassword(
    forgotPasswordDto: ForgotPasswordDto,
  ): Promise<ApiResponse<null>> {
    const user = await this.prisma.user.findUnique({
      where: { email: forgotPasswordDto.email },
    });

    if (!user) {
      // Don't reveal if user exists or not for security
      return {
        success: true,
        message: 'If the email exists, a reset code has been sent',
        data: null,
      };
    }

    // Generate a 6-digit reset code
    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();

    // Store the reset code and expiration time (15 minutes from now)
    const resetCodeExpiry = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    await this.prisma.user.update({
      where: { email: forgotPasswordDto.email },
      data: {
        resetCode,
        resetCodeExpiry,
      },
    });

    // Send password reset email
    try {
      await this.mailerService.sendPasswordResetEmail({
        email: user.email,
        name: user.name,
        resetCode,
      });
    } catch (emailError) {
      console.error('Failed to send password reset email:', emailError);
      throw new BadRequestException('Failed to send reset code');
    }

    return {
      success: true,
      message: 'Reset code sent successfully',
      data: null,
    };
  }

  /**
   * Verify reset code
   * @param verifyResetCodeDto Email and reset code to verify
   * @returns Success message if valid
   */
  async verifyResetCode(
    verifyResetCodeDto: VerifyResetCodeDto,
  ): Promise<ApiResponse<null>> {
    const user = await this.prisma.user.findUnique({
      where: { email: verifyResetCodeDto.email },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!user.resetCode || !user.resetCodeExpiry) {
      throw new BadRequestException('No reset code found');
    }

    if (new Date() > user.resetCodeExpiry) {
      throw new BadRequestException('Reset code has expired');
    }

    if (user.resetCode !== verifyResetCodeDto.resetCode) {
      throw new BadRequestException('Invalid reset code');
    }

    return {
      success: true,
      message: 'Reset code verified successfully',
      data: null,
    };
  }
  /**
   * Reset password using reset code
   * @param resetPasswordDto Email, reset code, and new password
   * @returns Success message if password reset is successful
   */

  async resetPassword(
    resetPasswordDto: ResetPasswordDto,
  ): Promise<ApiResponse<null>> {
    const user = await this.prisma.user.findUnique({
      where: { email: resetPasswordDto.email },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!user.resetCode || !user.resetCodeExpiry) {
      throw new BadRequestException('No reset code found');
    }

    if (new Date() > user.resetCodeExpiry) {
      throw new BadRequestException('Reset code has expired');
    }

    if (user.resetCode !== resetPasswordDto.resetCode) {
      throw new BadRequestException('Invalid reset code');
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(resetPasswordDto.newPassword, 10);

    // Update password and clear reset code
    await this.prisma.user.update({
      where: { email: resetPasswordDto.email },
      data: {
        password: hashedPassword,
        resetCode: null,
        resetCodeExpiry: null,
      },
    });

    return {
      success: true,
      message: 'Password reset successfully',
      data: null,
    };
  }
}
