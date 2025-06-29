import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class BookingService {
  private baseUrl = 'http://localhost:3000';

  constructor(private http: HttpClient) {}

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('accessToken');
    return new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });
  }

  createBooking(data: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/vehicles/bookings`, data, {
      headers: this.getAuthHeaders(),
    });
  }

  getUserBookings(): Observable<any> {
    return this.http.get(`${this.baseUrl}/vehicles/bookings/my`, {
      headers: this.getAuthHeaders(),
    });
  }

  getBookingById(bookingId: string): Observable<any> {
    return this.http.get(`${this.baseUrl}/vehicles/bookings/${bookingId}`, {
      headers: this.getAuthHeaders(),
    });
  }

  cancelBooking(bookingId: string): Observable<any> {
    return this.http.put(`${this.baseUrl}/vehicles/bookings/${bookingId}/cancel`, {}, {
      headers: this.getAuthHeaders(),
    });
  }

  getAgentBookings(status: string = 'PENDING'): Observable<any[]> {
    // Fetch bookings for agent's vehicles by status (default: PENDING)
    return this.http.get<any[]>(`${this.baseUrl}/vehicles/bookings/status/${status}`, {
      headers: this.getAuthHeaders(),
    });
  }

  approveBooking(bookingId: string): Observable<any> {
    return this.http.put(`${this.baseUrl}/vehicles/bookings/${bookingId}/confirm`, {}, {
      headers: this.getAuthHeaders(),
    });
  }

  declineBooking(bookingId: string): Observable<any> {
    return this.http.put(`${this.baseUrl}/vehicles/bookings/${bookingId}/cancel`, {}, {
      headers: this.getAuthHeaders(),
    });
  }
} 