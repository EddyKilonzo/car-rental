import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

interface Vehicle {
  id: string;
  make: string;
  model: string;
  year: number;
  vehicleType: string;
  fuelType: string;
  transmission: string;
  seats: number;
  doors: number;
  color: string;
  pricePerDay: number;
  pricePerWeek?: number;
  pricePerMonth?: number;
  status: string;
  isActive: boolean;
  description?: string;
  features?: string[];
  mainImageUrl?: string;
  galleryImages?: string[];
  interiorImages?: string[];
  exteriorImages?: string[];
  userId: string;
  user?: {
    id: string;
    name: string;
    email: string;
    avatarUrl?: string;
  };
}

interface VehicleResponse {
  success: boolean;
  data: Vehicle | Vehicle[];
  message?: string;
}

interface SearchParams {
  searchTerm?: string;
  vehicleType?: string;
  fuelType?: string;
  transmission?: string;
  minPrice?: number;
  maxPrice?: number;
}

interface CreateVehicleData {
  make: string;
  model: string;
  year: number;
  vehicleType: string;
  fuelType: string;
  transmission: string;
  seats: number;
  doors: number;
  color: string;
  pricePerDay: number;
  pricePerWeek?: number;
  pricePerMonth?: number;
  description?: string;
  features?: string[];
}

@Injectable({
  providedIn: 'root',
})
export class VehicleService {
  private http = inject(HttpClient);

  private baseUrl = 'http://localhost:3000';

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('accessToken');
    return new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });
  }

  getVehicleById(vehicleId: string): Observable<Vehicle> {
    return this.http.get<Vehicle>(`${this.baseUrl}/vehicles/${vehicleId}`);
  }

  getAllVehicles(): Observable<Vehicle[]> {
    return this.http.get<Vehicle[]>(`${this.baseUrl}/vehicles`);
  }

  searchVehicles(params: SearchParams): Observable<VehicleResponse> {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, value.toString());
      }
    });

    return this.http.get<VehicleResponse>(`${this.baseUrl}/vehicles/search?${queryParams.toString()}`);
  }

  // Agent methods for managing vehicles
  createVehicle(vehicleData: CreateVehicleData): Observable<VehicleResponse> {
    return this.http.post<VehicleResponse>(`${this.baseUrl}/vehicles`, vehicleData, {
      headers: this.getAuthHeaders(),
    });
  }

  updateVehicle(vehicleId: string, vehicleData: Partial<CreateVehicleData>): Observable<VehicleResponse> {
    return this.http.put<VehicleResponse>(`${this.baseUrl}/vehicles/${vehicleId}`, vehicleData, {
      headers: this.getAuthHeaders(),
    });
  }
} 