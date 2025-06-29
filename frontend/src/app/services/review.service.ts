import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

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
  };
  booking: {
    id: string;
    vehicle: {
      id: string;
      make: string;
      model: string;
    };
  };
}

@Injectable({
  providedIn: 'root'
})
export class ReviewService {
  private apiUrl = `${environment.apiUrl}/vehicles`;

  constructor(private http: HttpClient) {}

  createReview(reviewData: CreateReviewRequest): Observable<any> {
    return this.http.post(`${this.apiUrl}/reviews`, reviewData, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
      }
    });
  }

  getVehicleReviews(vehicleId: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/${vehicleId}/reviews`);
  }

  getUserReviews(): Observable<any> {
    return this.http.get(`${this.apiUrl}/reviews/user`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
      }
    });
  }

  getReviews(): Observable<any> {
    return this.http.get(`${this.apiUrl}/reviews`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
      }
    });
  }
} 