import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

interface SystemStats {
  users: {
    total: number;
    customers: number;
    agents: number;
    admins: number;
  };
  vehicles: {
    total: number;
    available: number;
    rented: number;
    maintenance: number;
    outOfService: number;
  };
  bookings: {
    total: number;
    active: number;
    pending: number;
    completed: number;
    cancelled: number;
  };
  reviews: {
    total: number;
    averageRating: number;
  };
  revenue: {
    total: number;
    averagePerBooking: number;
  };
}

interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  isVerified?: boolean;
  profileImageUrl?: string | null;
}

interface Vehicle {
  id: string;
  make: string;
  model: string;
  year: number;
  licensePlate: string;
  vin: string;
  mileage: number;
  vehicleType: string;
  fuelType: string;
  transmission: string;
  seats: number;
  doors: number;
  color: string;
  pricePerDay: number;
  status: string;
  isActive: boolean;
  mainImageUrl?: string;
  userId: string;
}

interface Review {
  id: string;
  rating: number;
  comment: string;
  createdAt: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
  booking: {
    id: string;
    vehicle: {
      id: string;
      make: string;
      model: string;
      year: number;
      licensePlate: string;
      mainImageUrl?: string;
    };
  };
}

interface AgentApplication {
  id: string;
  userId: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    phone?: string | null;
  };
}

interface AdminResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

interface PaginationData {
  pages: number;
  total: number;
}

interface ReviewsResponse {
  success: boolean;
  data: {
    reviews: Review[];
    pagination: PaginationData;
  };
}

interface ReviewStatsResponse {
  success: boolean;
  data: {
    totalReviews: number;
    averageRating: number;
    ratingDistribution: { rating: number; count: number }[];
    recentReviews: Review[];
  };
}

@Injectable({
  providedIn: 'root',
})
export class AdminService {
  private http = inject(HttpClient);

  private baseUrl = 'http://localhost:3000';

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('accessToken');
    return new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });
  }

  getSystemStats(): Observable<SystemStats> {
    return this.http.get<SystemStats>(`${this.baseUrl}/admin/stats`, {
      headers: this.getAuthHeaders(),
    });
  }

  getAllUsers(): Observable<{ users: User[]; pagination: PaginationData }> {
    return this.http.get<{ users: User[]; pagination: PaginationData }>(`${this.baseUrl}/admin/users`, {
      headers: this.getAuthHeaders(),
    });
  }

  getAllVehicles(): Observable<AdminResponse<{ vehicles: Vehicle[] }>> {
    return this.http.get<AdminResponse<{ vehicles: Vehicle[] }>>(`${this.baseUrl}/admin/vehicles`, {
      headers: this.getAuthHeaders(),
    });
  }

  getPendingAgentApplications(): Observable<AdminResponse<{ applications: AgentApplication[] }>> {
    console.log('AdminService: Making request to get pending agent applications');
    console.log('AdminService: Base URL:', this.baseUrl);
    console.log('AdminService: Auth headers:', this.getAuthHeaders());
    
    return this.http.get<AdminResponse<{ applications: AgentApplication[] }>>(`${this.baseUrl}/agent/applications/pending`, {
      headers: this.getAuthHeaders(),
    });
  }

  approveAgent(userId: string): Observable<AdminResponse<unknown>> {
    return this.http.put<AdminResponse<unknown>>(`${this.baseUrl}/agent/applications/${userId}/approve`, {}, {
      headers: this.getAuthHeaders(),
    });
  }

  rejectAgent(userId: string): Observable<AdminResponse<unknown>> {
    return this.http.put<AdminResponse<unknown>>(`${this.baseUrl}/agent/applications/${userId}/reject`, {}, {
      headers: this.getAuthHeaders(),
    });
  }

  toggleUserStatus(userId: string): Observable<AdminResponse<unknown>> {
    return this.http.put<AdminResponse<unknown>>(`${this.baseUrl}/admin/users/${userId}/toggle-status`, {}, {
      headers: this.getAuthHeaders(),
    });
  }

  updateUserRole(userId: string, role: string): Observable<AdminResponse<unknown>> {
    return this.http.put<AdminResponse<unknown>>(`${this.baseUrl}/admin/users/${userId}/role`, { role }, {
      headers: this.getAuthHeaders(),
    });
  }

  deleteUser(userId: string): Observable<AdminResponse<unknown>> {
    return this.http.delete<AdminResponse<unknown>>(`${this.baseUrl}/admin/users/${userId}`, {
      headers: this.getAuthHeaders(),
    });
  }

  getAllReviews(page = 1, limit = 10, minRating?: number, maxRating?: number): Observable<ReviewsResponse> {
    let url = `${this.baseUrl}/admin/reviews?page=${page}&limit=${limit}`;
    if (minRating !== undefined) url += `&minRating=${minRating}`;
    if (maxRating !== undefined) url += `&maxRating=${maxRating}`;
    
    return this.http.get<ReviewsResponse>(url, {
      headers: this.getAuthHeaders(),
    });
  }

  getReviewStats(): Observable<ReviewStatsResponse> {
    return this.http.get<ReviewStatsResponse>(`${this.baseUrl}/admin/reviews/stats`, {
      headers: this.getAuthHeaders(),
    });
  }

  deleteReview(reviewId: string): Observable<AdminResponse<unknown>> {
    return this.http.delete<AdminResponse<unknown>>(`${this.baseUrl}/admin/reviews/${reviewId}`, {
      headers: this.getAuthHeaders(),
    });
  }
} 