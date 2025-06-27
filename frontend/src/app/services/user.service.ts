import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

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

  getProfile(): Observable<any> {
    return this.http.get(`${this.baseUrl}/users/profile`, {
      headers: this.getAuthHeaders(),
    });
  }

  updateProfile(data: any): Observable<any> {
    return this.http.put(`${this.baseUrl}/users/profile`, data, {
      headers: this.getAuthHeaders(),
    });
  }

  completeProfile(data: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/users/complete-profile`, data, {
      headers: this.getAuthHeaders(),
    });
  }

  getAllUsers(): Observable<any> {
    return this.http.get(`${this.baseUrl}/users`, {
      headers: this.getAuthHeaders(),
    });
  }

  getUserById(id: string): Observable<any> {
    return this.http.get(`${this.baseUrl}/users/${id}`, {
      headers: this.getAuthHeaders(),
    });
  }

  updateUser(id: string, data: any): Observable<any> {
    return this.http.put(`${this.baseUrl}/users/${id}`, data, {
      headers: this.getAuthHeaders(),
    });
  }

  deleteUser(id: string): Observable<any> {
    return this.http.delete(`${this.baseUrl}/users/${id}`, {
      headers: this.getAuthHeaders(),
    });
  }
} 