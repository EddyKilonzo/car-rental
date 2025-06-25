import {
  IsEmail,
  IsString,
  IsOptional,
  MinLength,
  IsEnum,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// Define user roles
export enum UserRole {
  CUSTOMER = 'CUSTOMER',
  AGENT = 'AGENT',
  ADMIN = 'ADMIN',
}

export class CreateUserDto {
  @ApiProperty({
    example: 'john.doe@example.com',
    description: 'User email address (must be unique)',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    example: 'John Doe',
    description: 'Full name of the user',
  })
  @IsString()
  name: string;

  @ApiProperty({
    example: 'password123',
    minLength: 6,
    description: 'Password (minimum 6 characters)',
  })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiPropertyOptional({
    example: '+1234567890',
    description: 'Phone number (optional)',
  })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({
    enum: UserRole,
    default: UserRole.CUSTOMER,
    description: 'User role (defaults to CUSTOMER)',
  })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole = UserRole.CUSTOMER;
}
