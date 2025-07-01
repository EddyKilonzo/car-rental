import { IsDateString, IsOptional, IsString } from 'class-validator';

export class CreateBookingDto {
  @IsDateString()
  startDate: string;

  @IsDateString()
  endDate: string;

  @IsString()
  vehicleId: string;

  @IsOptional()
  @IsString()
  pickupLocation?: string;

  @IsOptional()
  @IsString()
  returnLocation?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
