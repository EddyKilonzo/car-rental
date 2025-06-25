import { IsString, IsOptional, Matches } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CompleteProfileDto {
  @ApiProperty({
    example: 'DL123456789',
    description: 'Driver license number (required for car rental)',
  })
  @IsString()
  licenseNumber: string;

  @ApiProperty({
    example: '1990-01-15',
    description: 'Date of birth in YYYY-MM-DD format (required for car rental)',
  })
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'dateOfBirth must be in YYYY-MM-DD format',
  })
  dateOfBirth: string;

  @ApiProperty({
    example: '123 Main St',
    description: 'Street address (required for car rental)',
  })
  @IsString()
  address: string;

  @ApiProperty({
    example: 'New York',
    description: 'City (required for car rental)',
  })
  @IsString()
  city: string;

  @ApiProperty({
    example: 'NY',
    description: 'State/Province (required for car rental)',
  })
  @IsString()
  state: string;

  @ApiProperty({
    example: '10001',
    description: 'ZIP/Postal code (required for car rental)',
  })
  @IsString()
  zipCode: string;

  @ApiProperty({
    example: 'USA',
    description: 'Country (required for car rental)',
  })
  @IsString()
  country: string;

  @ApiPropertyOptional({
    example: '+1234567890',
    description: 'Phone number (if not provided during signup)',
  })
  @IsOptional()
  @IsString()
  phone?: string;
}
