import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

interface UploadResponse {
  message: string;
  url?: string;
  urls?: string[];
  uploadResult?: {
    secure_url: string;
    public_id: string;
    width?: number;
    height?: number;
  };
  user?: any;
}

// Direct Cloudinary response for vehicle uploads
interface CloudinaryUploadResult {
  public_id: string;
  secure_url: string;
  url: string;
  original_filename: string;
  bytes: number;
  format: string;
  resource_type: string;
  created_at: string;
  width?: number;
  height?: number;
  folder: string;
}

interface LicenseUrlsResponse {
  urls: string[];
}

@Injectable({
  providedIn: 'root',
})
export class UploadService {
  private http = inject(HttpClient);

  private baseUrl = 'http://localhost:3000';

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('accessToken');
    return new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });
  }

  // Profile Image Upload
  uploadProfilePhoto(file: File): Observable<UploadResponse> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<UploadResponse>(`${this.baseUrl}/users/profile/upload-photo`, formData, {
      headers: this.getAuthHeaders(),
    });
  }

  // License Document Upload
  uploadLicenseDocument(file: File): Observable<UploadResponse> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<UploadResponse>(`${this.baseUrl}/users/profile/upload-license`, formData, {
      headers: this.getAuthHeaders(),
    });
  }

  // Vehicle Image Uploads - these return CloudinaryUploadResult directly
  uploadVehicleMainImage(file: File): Observable<CloudinaryUploadResult> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<CloudinaryUploadResult>(`${this.baseUrl}/upload/vehicle/main-image`, formData, {
      headers: this.getAuthHeaders(),
    });
  }

  uploadVehicleGalleryImages(files: File[]): Observable<CloudinaryUploadResult[]> {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append('files', file);
    });
    return this.http.post<CloudinaryUploadResult[]>(`${this.baseUrl}/upload/vehicle/gallery`, formData, {
      headers: this.getAuthHeaders(),
    });
  }

  uploadVehicleInteriorImages(files: File[]): Observable<CloudinaryUploadResult[]> {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append('files', file);
    });
    return this.http.post<CloudinaryUploadResult[]>(`${this.baseUrl}/upload/vehicle/interior`, formData, {
      headers: this.getAuthHeaders(),
    });
  }

  uploadVehicleExteriorImages(files: File[]): Observable<CloudinaryUploadResult[]> {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append('files', file);
    });
    return this.http.post<CloudinaryUploadResult[]>(`${this.baseUrl}/upload/vehicle/exterior`, formData, {
      headers: this.getAuthHeaders(),
    });
  }

  uploadVehicleDocuments(files: File[]): Observable<CloudinaryUploadResult[]> {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append('files', file);
    });
    return this.http.post<CloudinaryUploadResult[]>(`${this.baseUrl}/upload/vehicle/documents`, formData, {
      headers: this.getAuthHeaders(),
    });
  }

  // Legacy method for backward compatibility
  uploadVehicleImage(file: File): Observable<CloudinaryUploadResult> {
    return this.uploadVehicleMainImage(file);
  }

  getLicenseDocumentUrls(): Observable<LicenseUrlsResponse> {
    return this.http.get<LicenseUrlsResponse>(`${this.baseUrl}/users/profile/license-urls`, {
      headers: this.getAuthHeaders(),
    });
  }
} 