export interface UserResponse {
  id: string;
  email: string;
  name: string;
  phone?: string | null;
  role: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  licenseNumber?: string | null;
  dateOfBirth?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  zipCode?: string | null;
  country?: string | null;
  isVerified?: boolean;
  profileImageUrl?: string | null;
  licenseDocumentUrl?: string | null;
}

export interface UserProfileResponse extends UserResponse {
  bookings?: Array<{
    id: string;
    startDate: Date;
    endDate: Date;
    totalPrice: number;
    status: string;
    vehicle: {
      id: string;
      make: string;
      model: string;
      year: number;
      licensePlate: string;
    };
  }>;
}

export interface PaginatedUsersResponse {
  users: UserResponse[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}
