import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class UploadService {
  private baseUrl = 'http://localhost:3000';

  constructor(private http: HttpClient) {}

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('accessToken');
    return new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });
  }

  uploadProfilePhoto(file: File): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post(`${this.baseUrl}/users/profile/upload-photo`, formData, {
      headers: this.getAuthHeaders(),
    });
  }

  uploadLicenseDocument(file: File): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post(`${this.baseUrl}/users/profile/upload-license`, formData, {
      headers: this.getAuthHeaders(),
    });
  }

  getLicenseDocumentUrls(): Observable<any> {
    return this.http.get(`${this.baseUrl}/users/profile/license-urls`, {
      headers: this.getAuthHeaders(),
    });
  }
} 