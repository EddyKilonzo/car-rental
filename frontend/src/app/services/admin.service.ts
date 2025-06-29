import { Injectable } from '@angular/core';
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

@Injectable({
  providedIn: 'root',
})
export class AdminService {
  private baseUrl = 'http://localhost:3000';

  constructor(private http: HttpClient) {}

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

  getAllUsers(): Observable<any> {
    return this.http.get(`${this.baseUrl}/admin/users`, {
      headers: this.getAuthHeaders(),
    });
  }

  getAllVehicles(): Observable<any> {
    return this.http.get(`${this.baseUrl}/admin/vehicles`, {
      headers: this.getAuthHeaders(),
    });
  }

  getPendingAgentApplications(): Observable<any> {
    return this.http.get(`${this.baseUrl}/agent/applications/pending`, {
      headers: this.getAuthHeaders(),
    });
  }

  approveAgent(userId: string): Observable<any> {
    return this.http.put(`${this.baseUrl}/agent/applications/${userId}/approve`, {}, {
      headers: this.getAuthHeaders(),
    });
  }

  rejectAgent(userId: string): Observable<any> {
    return this.http.put(`${this.baseUrl}/agent/applications/${userId}/reject`, {}, {
      headers: this.getAuthHeaders(),
    });
  }

  toggleUserStatus(userId: string): Observable<any> {
    return this.http.put(`${this.baseUrl}/admin/users/${userId}/toggle-status`, {}, {
      headers: this.getAuthHeaders(),
    });
  }

  updateUserRole(userId: string, role: string): Observable<any> {
    return this.http.put(`${this.baseUrl}/admin/users/${userId}/role`, { role }, {
      headers: this.getAuthHeaders(),
    });
  }

  deleteUser(userId: string): Observable<any> {
    return this.http.delete(`${this.baseUrl}/admin/users/${userId}`, {
      headers: this.getAuthHeaders(),
    });
  }

  getAllReviews(page: number = 1, limit: number = 10, minRating?: number, maxRating?: number): Observable<any> {
    let url = `${this.baseUrl}/admin/reviews?page=${page}&limit=${limit}`;
    if (minRating !== undefined) url += `&minRating=${minRating}`;
    if (maxRating !== undefined) url += `&maxRating=${maxRating}`;
    
    return this.http.get(url, {
      headers: this.getAuthHeaders(),
    });
  }

  getReviewStats(): Observable<any> {
    return this.http.get(`${this.baseUrl}/admin/reviews/stats`, {
      headers: this.getAuthHeaders(),
    });
  }

  deleteReview(reviewId: string): Observable<any> {
    return this.http.delete(`${this.baseUrl}/admin/reviews/${reviewId}`, {
      headers: this.getAuthHeaders(),
    });
  }
} 