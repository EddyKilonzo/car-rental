import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsEnum,
  IsArray,
  Min,
  Max,
  IsPositive,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum FuelType {
  PETROL = 'PETROL',
  DIESEL = 'DIESEL',
  ELECTRIC = 'ELECTRIC',
  HYBRID = 'HYBRID',
  LPG = 'LPG',
}

export enum TransmissionType {
  MANUAL = 'MANUAL',
  AUTOMATIC = 'AUTOMATIC',
}

export enum VehicleType {
  SEDAN = 'SEDAN',
  SUV = 'SUV',
  HATCHBACK = 'HATCHBACK',
  COUPE = 'COUPE',
  CONVERTIBLE = 'CONVERTIBLE',
  VAN = 'VAN',
  TRUCK = 'TRUCK',
  LUXURY = 'LUXURY',
}

export class CreateVehicleDto {
  @ApiProperty({
    example: 'Toyota',
    description: 'Vehicle make/brand',
  })
  @IsString()
  @IsNotEmpty()
  make: string;

  @ApiProperty({
    example: 'Camry',
    description: 'Vehicle model',
  })
  @IsString()
  @IsNotEmpty()
  model: string;

  @ApiProperty({
    example: 2022,
    description: 'Vehicle year',
  })
  @IsNumber()
  @Min(1900)
  @Max(new Date().getFullYear() + 1)
  year: number;

  @ApiProperty({
    example: 'ABC123',
    description: 'License plate number (must be unique)',
  })
  @IsString()
  @IsNotEmpty()
  licensePlate: string;

  @ApiProperty({
    example: '1HGBH41JXMN109186',
    description: 'Vehicle Identification Number (must be unique)',
  })
  @IsString()
  @IsNotEmpty()
  vin: string;

  @ApiProperty({
    example: 50000,
    description: 'Current mileage in kilometers',
  })
  @IsNumber()
  @IsPositive()
  mileage: number;

  @ApiProperty({
    enum: FuelType,
    example: FuelType.PETROL,
    description: 'Fuel type of the vehicle',
  })
  @IsEnum(FuelType)
  fuelType: FuelType;

  @ApiProperty({
    enum: TransmissionType,
    example: TransmissionType.AUTOMATIC,
    description: 'Transmission type',
  })
  @IsEnum(TransmissionType)
  transmission: TransmissionType;

  @ApiProperty({
    enum: VehicleType,
    example: VehicleType.SEDAN,
    description: 'Type of vehicle',
  })
  @IsEnum(VehicleType)
  vehicleType: VehicleType;

  @ApiProperty({
    example: 5,
    description: 'Number of seats',
  })
  @IsNumber()
  @Min(1)
  @Max(20)
  seats: number;

  @ApiProperty({
    example: 4,
    description: 'Number of doors',
  })
  @IsNumber()
  @Min(2)
  @Max(6)
  doors: number;

  @ApiProperty({
    example: 'Silver',
    description: 'Vehicle color',
  })
  @IsString()
  @IsNotEmpty()
  color: string;

  @ApiPropertyOptional({
    example: 'Well-maintained sedan with excellent fuel efficiency',
    description: 'Vehicle description',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    example: ['GPS', 'Bluetooth', 'Backup Camera', 'Heated Seats'],
    description: 'Array of vehicle features',
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  features?: string[];

  @ApiPropertyOptional({
    example: [
      'https://example.com/image1.jpg',
      'https://example.com/image2.jpg',
    ],
    description: 'Array of vehicle image URLs',
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images?: string[];

  @ApiProperty({
    example: 75.5,
    description: 'Price per day in currency units',
  })
  @IsNumber()
  @IsPositive()
  pricePerDay: number;

  @ApiPropertyOptional({
    example: 450.0,
    description: 'Price per week in currency units',
  })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  pricePerWeek?: number;

  @ApiPropertyOptional({
    example: 1800.0,
    description: 'Price per month in currency units',
  })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  pricePerMonth?: number;
}
