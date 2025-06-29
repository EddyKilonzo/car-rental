import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

interface User {
  id: string;
  email: string;
  name: string;
  phone?: string | null;
  role: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
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

interface ProfileUpdateData {
  name?: string | null;
  phone?: string | null;
  licenseNumber?: string | null;
  dateOfBirth?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  zipCode?: string | null;
  country?: string | null;
  isActive?: boolean;
  profileImageUrl?: string | null;
}

interface CompleteProfileData {
  name: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
  licenseNumber?: string;
  dateOfBirth?: string;
}

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private baseUrl = 'http://localhost:3000';

  constructor(private http: HttpClient) {}

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('accessToken');
    return new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });
  }

  getProfile(): Observable<ApiResponse<User>> {
    return this.http.get<ApiResponse<User>>(`${this.baseUrl}/users/profile`, {
      headers: this.getAuthHeaders(),
    });
  }

  updateProfile(data: ProfileUpdateData): Observable<ApiResponse<User>> {
    return this.http.patch<ApiResponse<User>>(`${this.baseUrl}/users/profile`, data, {
      headers: this.getAuthHeaders(),
    });
  }

  updateProfileById(id: string, data: ProfileUpdateData): Observable<ApiResponse<User>> {
    return this.http.put<ApiResponse<User>>(`${this.baseUrl}/users/${id}`, data, {
      headers: this.getAuthHeaders(),
    });
  }

  completeProfile(data: CompleteProfileData): Observable<ApiResponse<User>> {
    return this.http.post<ApiResponse<User>>(`${this.baseUrl}/users/complete-profile`, data, {
      headers: this.getAuthHeaders(),
    });
  }

  getAllUsers(): Observable<ApiResponse<User[]>> {
    return this.http.get<ApiResponse<User[]>>(`${this.baseUrl}/users`, {
      headers: this.getAuthHeaders(),
    });
  }

  getUserById(id: string): Observable<ApiResponse<User>> {
    return this.http.get<ApiResponse<User>>(`${this.baseUrl}/users/${id}`, {
      headers: this.getAuthHeaders(),
    });
  }

  updateUser(id: string, data: ProfileUpdateData): Observable<ApiResponse<User>> {
    return this.http.put<ApiResponse<User>>(`${this.baseUrl}/users/${id}`, data, {
      headers: this.getAuthHeaders(),
    });
  }

  deleteUser(id: string): Observable<ApiResponse<{ message: string }>> {
    return this.http.delete<ApiResponse<{ message: string }>>(`${this.baseUrl}/users/${id}`, {
      headers: this.getAuthHeaders(),
    });
  }

  // Delete current user's profile (soft delete - deactivate)
  deactivateProfile(): Observable<ApiResponse<{ message: string }>> {
    return this.http.delete<ApiResponse<{ message: string }>>(`${this.baseUrl}/users/profile`, {
      headers: this.getAuthHeaders(),
    });
  }

  // Permanently delete current user's profile
  deleteProfilePermanently(): Observable<ApiResponse<{ message: string }>> {
    return this.http.delete<ApiResponse<{ message: string }>>(`${this.baseUrl}/users/profile/permanent`, {
      headers: this.getAuthHeaders(),
    });
  }
} 