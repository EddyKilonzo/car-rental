import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class AgentService {
  private apiUrl = `${environment.apiUrl}/agent`;

  constructor(private http: HttpClient) {}

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('accessToken');
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
  }

  applyToBecomeAgent(): Observable<any> {
    return this.http.post(`${this.apiUrl}/apply`, {}, {
      headers: this.getAuthHeaders(),
    });
  }

  getApplicationStatus(): Observable<any> {
    return this.http.get(`${this.apiUrl}/application/status`, {
      headers: this.getAuthHeaders(),
    });
  }

  getAgentVehicles(): Observable<any> {
    return this.http.get(`${this.apiUrl}/vehicles`, {
      headers: this.getAuthHeaders(),
    });
  }

  uploadVehicleMainImage(file: File): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post(`${this.apiUrl}/upload/vehicle/main-image`, formData, {
      headers: this.getAuthHeaders(),
    });
  }

  uploadVehicleGallery(files: File[]): Observable<any> {
    const formData = new FormData();
    files.forEach(file => formData.append('files', file));
    return this.http.post(`${this.apiUrl}/upload/vehicle/gallery`, formData, {
      headers: this.getAuthHeaders(),
    });
  }

  uploadVehicleInterior(files: File[]): Observable<any> {
    const formData = new FormData();
    files.forEach(file => formData.append('files', file));
    return this.http.post(`${this.apiUrl}/upload/vehicle/interior`, formData, {
      headers: this.getAuthHeaders(),
    });
  }

  uploadVehicleExterior(files: File[]): Observable<any> {
    const formData = new FormData();
    files.forEach(file => formData.append('files', file));
    return this.http.post(`${this.apiUrl}/upload/vehicle/exterior`, formData, {
      headers: this.getAuthHeaders(),
    });
  }

  uploadVehicleDocuments(files: File[]): Observable<any> {
    const formData = new FormData();
    files.forEach(file => formData.append('files', file));
    return this.http.post(`${this.apiUrl}/upload/vehicle/documents`, formData, {
      headers: this.getAuthHeaders(),
    });
  }

  getAgentBookings(): Observable<any> {
    return this.http.get(`${this.apiUrl}/bookings`, { headers: this.getAuthHeaders() });
  }

  getAgentReviews(): Observable<any> {
    return this.http.get(`${this.apiUrl}/reviews`, { headers: this.getAuthHeaders() });
  }

  approveBooking(bookingId: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/bookings/${bookingId}/approve`, {}, { headers: this.getAuthHeaders() });
  }

  declineBooking(bookingId: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/bookings/${bookingId}/decline`, {}, { headers: this.getAuthHeaders() });
  }

  markBookingAsActive(bookingId: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/bookings/${bookingId}/active`, {}, { headers: this.getAuthHeaders() });
  }

  markBookingAsCompleted(bookingId: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/bookings/${bookingId}/completed`, {}, { headers: this.getAuthHeaders() });
  }
} 