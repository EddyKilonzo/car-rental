export interface User {
  id: string;
  name: string;
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string | null;
  role: string;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
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

export interface AuthResponse {
  success?: boolean;
  accessToken?: string;
  user?: User;
  message?: string;
  data?: {
    accessToken: string;
    user: User;
  };
}

export interface UploadResponse {
  success?: boolean;
  message?: string;
  user?: User;
  uploadResult?: {
    secure_url: string;
  };
} 