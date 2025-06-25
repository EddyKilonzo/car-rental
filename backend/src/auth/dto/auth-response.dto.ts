import { ApiProperty } from '@nestjs/swagger';

export class AuthResponseDto {
  @ApiProperty({
    description: 'JWT access token',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  accessToken: string;

  @ApiProperty({
    description: 'User information',
    example: {
      id: 'uuid',
      email: 'john.doe@example.com',
      name: 'John Doe',
      role: 'CUSTOMER',
    },
  })
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
  };
}
