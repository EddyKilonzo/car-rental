import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

interface Booking {
  id: string;
  startDate: string;
  endDate: string;
  totalPrice: number;
  status: string;
  pickupLocation?: string;
  returnLocation?: string;
  notes?: string;
  createdAt: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
  vehicle: {
    id: string;
    make: string;
    model: string;
    year: number;
    licensePlate: string;
    mainImageUrl?: string;
  };
}

interface BookingResponse {
  success: boolean;
  data: Booking | Booking[];
  message?: string;
}

interface CreateBookingData {
  vehicleId: string;
  startDate: string;
  endDate: string;
  pickupLocation?: string;
  returnLocation?: string;
  notes?: string;
}

@Injectable({
  providedIn: 'root',
})
export class BookingService {
  private http = inject(HttpClient);

  private baseUrl = 'http://localhost:3000';

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('accessToken');
    return new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });
  }

  createBooking(data: CreateBookingData): Observable<BookingResponse> {
    return this.http.post<BookingResponse>(`${this.baseUrl}/vehicles/bookings`, data, {
      headers: this.getAuthHeaders(),
    });
  }

  getUserBookings(): Observable<BookingResponse> {
    return this.http.get<BookingResponse>(`${this.baseUrl}/vehicles/bookings/my`, {
      headers: this.getAuthHeaders(),
    });
  }

  getBookingById(bookingId: string): Observable<BookingResponse> {
    return this.http.get<BookingResponse>(`${this.baseUrl}/vehicles/bookings/${bookingId}`, {
      headers: this.getAuthHeaders(),
    });
  }

  cancelBooking(bookingId: string): Observable<BookingResponse> {
    return this.http.put<BookingResponse>(`${this.baseUrl}/vehicles/bookings/${bookingId}/cancel`, {}, {
      headers: this.getAuthHeaders(),
    });
  }

  getAgentBookings(status = 'PENDING'): Observable<Booking[]> {
    // Fetch bookings for agent's vehicles by status (default: PENDING)
    return this.http.get<Booking[]>(`${this.baseUrl}/vehicles/bookings/status/${status}`, {
      headers: this.getAuthHeaders(),
    });
  }

  approveBooking(bookingId: string): Observable<BookingResponse> {
    return this.http.put<BookingResponse>(`${this.baseUrl}/vehicles/bookings/${bookingId}/confirm`, {}, {
      headers: this.getAuthHeaders(),
    });
  }

  declineBooking(bookingId: string): Observable<BookingResponse> {
    return this.http.put<BookingResponse>(`${this.baseUrl}/vehicles/bookings/${bookingId}/cancel`, {}, {
      headers: this.getAuthHeaders(),
    });
  }
} 