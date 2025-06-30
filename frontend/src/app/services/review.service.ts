import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface CreateReviewRequest {
  bookingId: string;
  rating: number;
  comment?: string;
}

export interface Review {
  id: string;
  rating: number;
  comment?: string;
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
    };
  };
}

interface ReviewResponse {
  success: boolean;
  data: Review | Review[];
  message?: string;
}

@Injectable({
  providedIn: 'root',
})
export class ReviewService {
  private http = inject(HttpClient);

  private baseUrl = 'http://localhost:3000';

  constructor() {}

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('accessToken');
    return new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });
  }

  createReview(reviewData: CreateReviewRequest): Observable<ReviewResponse> {
    return this.http.post<ReviewResponse>(`${this.baseUrl}/vehicles/reviews`, reviewData, {
      headers: this.getAuthHeaders(),
    });
  }

  getVehicleReviews(vehicleId: string): Observable<Review[]> {
    return this.http.get<Review[]>(`${this.baseUrl}/vehicles/${vehicleId}/reviews`, {
      headers: this.getAuthHeaders(),
    });
  }

  getUserReviews(): Observable<Review[]> {
    return this.http.get<Review[]>(`${this.baseUrl}/vehicles/reviews/my`, {
      headers: this.getAuthHeaders(),
    });
  }

  // Admin method to get all reviews
  getReviews(): Observable<ReviewResponse> {
    return this.http.get<ReviewResponse>(`${this.baseUrl}/admin/reviews`, {
      headers: this.getAuthHeaders(),
    });
  }
} 