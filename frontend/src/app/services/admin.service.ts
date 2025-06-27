import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

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

  getAllUsers(): Observable<any> {
    return this.http.get(`${this.baseUrl}/users`, {
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
} 