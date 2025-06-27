import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ReviewService {
  private baseUrl = 'http://localhost:3000';

  constructor(private http: HttpClient) {}

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('accessToken');
    return new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });
  }

  createReview(data: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/vehicles/reviews`, data, {
      headers: this.getAuthHeaders(),
    });
  }

  getVehicleReviews(vehicleId: string): Observable<any> {
    return this.http.get(`${this.baseUrl}/vehicles/${vehicleId}/reviews`, {
      headers: this.getAuthHeaders(),
    });
  }

  getUserReviews(userId: string): Observable<any> {
    return this.http.get(`${this.baseUrl}/users/${userId}/reviews`, {
      headers: this.getAuthHeaders(),
    });
  }
} 