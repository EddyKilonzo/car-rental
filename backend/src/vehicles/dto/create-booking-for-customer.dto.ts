import { IsDateString, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateBookingForCustomerDto {
  @IsDateString()
  startDate: string;

  @IsDateString()
  endDate: string;

  @IsString()
  @IsUUID()
  vehicleId: string;

  @IsString()
  @IsUUID()
  customerId: string; // The customer for whom the agent is booking

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
