import {
  IsString,
  IsOptional,
  IsUrl,
  IsBoolean,
  Matches,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateProfileDto {
  @ApiPropertyOptional({
    example: 'John Doe',
    description: 'Full name of the user',
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({
    example: '+1234567890',
    description: 'Phone number',
  })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({
    example: 'DL123456789',
    description: 'Driver license number',
  })
  @IsOptional()
  @IsString()
  licenseNumber?: string;

  @ApiPropertyOptional({
    example: '1990-01-15',
    description: 'Date of birth in YYYY-MM-DD format',
  })
  @IsOptional()
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'dateOfBirth must be in YYYY-MM-DD format',
  })
  dateOfBirth?: string;

  @ApiPropertyOptional({
    example: '123 Main Street',
    description: 'User address',
  })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({
    example: 'New York',
    description: 'City',
  })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({
    example: 'NY',
    description: 'State/Province',
  })
  @IsOptional()
  @IsString()
  state?: string;

  @ApiPropertyOptional({
    example: '10001',
    description: 'ZIP/Postal code',
  })
  @IsOptional()
  @IsString()
  zipCode?: string;

  @ApiPropertyOptional({
    example: 'USA',
    description: 'Country',
  })
  @IsOptional()
  @IsString()
  country?: string;

  @ApiPropertyOptional({
    example:
      'https://res.cloudinary.com/your-cloud/image/upload/v1234567890/car-rental/users/profiles/user123_profile.jpg',
    description: 'Profile image URL (Cloudinary URL)',
  })
  @IsOptional()
  @IsUrl()
  profileImageUrl?: string | null;

  @ApiPropertyOptional({
    example:
      'https://res.cloudinary.com/your-cloud/image/upload/v1234567890/car-rental/users/licenses/user123_license.pdf',
    description: 'License document URL (Cloudinary URL)',
  })
  @IsOptional()
  @IsUrl()
  licenseDocumentUrl?: string | null;

  @ApiPropertyOptional({
    example: true,
    description: 'Whether the user is verified',
  })
  @IsOptional()
  @IsBoolean()
  isVerified?: boolean;
}
