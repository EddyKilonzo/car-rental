import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class UploadService {
  private http = inject(HttpClient);

  private baseUrl = 'http://localhost:3000';

  /** Inserted by Angular inject() migration for backwards compatibility */
  constructor(...args: unknown[]);

  constructor() {}

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('accessToken');
    return new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });
  }

  // Profile Image Upload
  uploadProfilePhoto(file: File): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post(`${this.baseUrl}/users/profile/upload-photo`, formData, {
      headers: this.getAuthHeaders(),
    });
  }

  // License Document Upload
  uploadLicenseDocument(file: File): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post(`${this.baseUrl}/users/profile/upload-license`, formData, {
      headers: this.getAuthHeaders(),
    });
  }

  // Vehicle Image Uploads
  uploadVehicleMainImage(file: File): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post(`${this.baseUrl}/upload/vehicle/main-image`, formData, {
      headers: this.getAuthHeaders(),
    });
  }

  uploadVehicleGalleryImages(files: File[]): Observable<any> {
    const formData = new FormData();
    files.forEach((file, index) => {
      formData.append('files', file);
    });
    return this.http.post(`${this.baseUrl}/upload/vehicle/gallery`, formData, {
      headers: this.getAuthHeaders(),
    });
  }

  uploadVehicleInteriorImages(files: File[]): Observable<any> {
    const formData = new FormData();
    files.forEach((file, index) => {
      formData.append('files', file);
    });
    return this.http.post(`${this.baseUrl}/upload/vehicle/interior`, formData, {
      headers: this.getAuthHeaders(),
    });
  }

  uploadVehicleExteriorImages(files: File[]): Observable<any> {
    const formData = new FormData();
    files.forEach((file, index) => {
      formData.append('files', file);
    });
    return this.http.post(`${this.baseUrl}/upload/vehicle/exterior`, formData, {
      headers: this.getAuthHeaders(),
    });
  }

  uploadVehicleDocuments(files: File[]): Observable<any> {
    const formData = new FormData();
    files.forEach((file, index) => {
      formData.append('files', file);
    });
    return this.http.post(`${this.baseUrl}/upload/vehicle/documents`, formData, {
      headers: this.getAuthHeaders(),
    });
  }

  // Legacy method for backward compatibility
  uploadVehicleImage(file: File): Observable<any> {
    return this.uploadVehicleMainImage(file);
  }

  getLicenseDocumentUrls(): Observable<any> {
    return this.http.get(`${this.baseUrl}/users/profile/license-urls`, {
      headers: this.getAuthHeaders(),
    });
  }
} 