import { IsOptional, IsString, IsNumber, Min, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';

export enum VehicleTypeFilter {
  SEDAN = 'SEDAN',
  SUV = 'SUV',
  HATCHBACK = 'HATCHBACK',
  COUPE = 'COUPE',
  CONVERTIBLE = 'CONVERTIBLE',
  VAN = 'VAN',
  TRUCK = 'TRUCK',
  LUXURY = 'LUXURY',
}

export enum FuelTypeFilter {
  PETROL = 'PETROL',
  DIESEL = 'DIESEL',
  ELECTRIC = 'ELECTRIC',
  HYBRID = 'HYBRID',
  LPG = 'LPG',
}

export enum TransmissionTypeFilter {
  MANUAL = 'MANUAL',
  AUTOMATIC = 'AUTOMATIC',
}

export class SearchVehiclesDto {
  @IsOptional()
  @IsEnum(VehicleTypeFilter)
  vehicleType?: VehicleTypeFilter;

  @IsOptional()
  @IsEnum(FuelTypeFilter)
  fuelType?: FuelTypeFilter;

  @IsOptional()
  @IsEnum(TransmissionTypeFilter)
  transmission?: TransmissionTypeFilter;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  minPrice?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  maxPrice?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  seats?: number;

  @IsOptional()
  @IsString()
  make?: string;

  @IsOptional()
  @IsString()
  model?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1900)
  minYear?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  maxYear?: number;
}
