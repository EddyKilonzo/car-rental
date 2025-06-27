import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AgentService {
  private baseUrl = 'http://localhost:3000';

  constructor(private http: HttpClient) {}

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('accessToken');
    return new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });
  }

  applyToBecomeAgent(): Observable<any> {
    return this.http.post(`${this.baseUrl}/agent/apply`, {}, {
      headers: this.getAuthHeaders(),
    });
  }

  getAgentVehicles(): Observable<any> {
    return this.http.get(`${this.baseUrl}/agent/vehicles`, {
      headers: this.getAuthHeaders(),
    });
  }

  uploadVehicleMainImage(file: File): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post(`${this.baseUrl}/vehicles/upload/main-image`, formData, {
      headers: this.getAuthHeaders(),
    });
  }

  uploadVehicleGallery(files: File[]): Observable<any> {
    const formData = new FormData();
    files.forEach(file => formData.append('files', file));
    return this.http.post(`${this.baseUrl}/vehicles/upload/gallery`, formData, {
      headers: this.getAuthHeaders(),
    });
  }

  uploadVehicleInterior(files: File[]): Observable<any> {
    const formData = new FormData();
    files.forEach(file => formData.append('files', file));
    return this.http.post(`${this.baseUrl}/vehicles/upload/interior`, formData, {
      headers: this.getAuthHeaders(),
    });
  }

  uploadVehicleExterior(files: File[]): Observable<any> {
    const formData = new FormData();
    files.forEach(file => formData.append('files', file));
    return this.http.post(`${this.baseUrl}/vehicles/upload/exterior`, formData, {
      headers: this.getAuthHeaders(),
    });
  }

  uploadVehicleDocuments(files: File[]): Observable<any> {
    const formData = new FormData();
    files.forEach(file => formData.append('files', file));
    return this.http.post(`${this.baseUrl}/vehicles/upload/documents`, formData, {
      headers: this.getAuthHeaders(),
    });
  }
} 