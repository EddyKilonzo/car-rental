import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

interface AgentResponse {
  success: boolean;
  data: unknown;
  message?: string;
}

interface ApplicationStatus {
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'NOT_APPLIED';
  message?: string;
}

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
  status: string;
  isActive: boolean;
  mainImageUrl?: string;
  galleryImages?: string[];
  interiorImages?: string[];
  exteriorImages?: string[];
}

interface Booking {
  id: string;
  startDate: string;
  endDate: string;
  totalPrice: number;
  status: string;
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
    mainImageUrl?: string;
  };
}

interface Review {
  id: string;
  rating: number;
  comment?: string;
  createdAt: string;
  user: {
    id: string;
    name: string;
  };
  booking: {
    id: string;
    vehicle: {
      id: string;
      make: string;
      model: string;
      year: number;
    };
  };
}

interface EarningsStats {
  totalEarnings: number;
  monthlyEarnings: number;
  weeklyEarnings: number;
  totalBookings: number;
  completedBookings: number;
  averageRating: number;
  totalReviews: number;
}

interface VehicleEarnings {
  vehicleId: string;
  vehicleName: string;
  make: string;
  model: string;
  year: number;
  mainImageUrl?: string;
  totalEarnings: number;
  totalBookings: number;
  averageRating: number;
  totalReviews: number;
  lastBookingDate?: string;
}

@Injectable({
  providedIn: 'root',
})
export class AgentService {
  private http = inject(HttpClient);

  private baseUrl = 'http://localhost:3000';

  constructor() {}

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('accessToken');
    return new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });
  }

  applyToBecomeAgent(): Observable<AgentResponse> {
    return this.http.post<AgentResponse>(`${this.baseUrl}/agent/applications`, {}, {
      headers: this.getAuthHeaders(),
    });
  }

  getApplicationStatus(): Observable<ApplicationStatus> {
    return this.http.get<ApplicationStatus>(`${this.baseUrl}/agent/applications/status`, {
      headers: this.getAuthHeaders(),
    });
  }

  getAgentVehicles(): Observable<Vehicle[]> {
    return this.http.get<Vehicle[]>(`${this.baseUrl}/agent/vehicles`, {
      headers: this.getAuthHeaders(),
    });
  }

  uploadVehicleMainImage(file: File): Observable<AgentResponse> {
    const formData = new FormData();
    formData.append('image', file);
    return this.http.post<AgentResponse>(`${this.baseUrl}/agent/vehicles/upload/main-image`, formData, {
      headers: this.getAuthHeaders(),
    });
  }

  uploadVehicleGallery(files: File[]): Observable<AgentResponse> {
    const formData = new FormData();
    files.forEach((file, index) => {
      formData.append(`images`, file);
    });
    return this.http.post<AgentResponse>(`${this.baseUrl}/agent/vehicles/upload/gallery`, formData, {
      headers: this.getAuthHeaders(),
    });
  }

  uploadVehicleInterior(files: File[]): Observable<AgentResponse> {
    const formData = new FormData();
    files.forEach((file, index) => {
      formData.append(`images`, file);
    });
    return this.http.post<AgentResponse>(`${this.baseUrl}/agent/vehicles/upload/interior`, formData, {
      headers: this.getAuthHeaders(),
    });
  }

  uploadVehicleExterior(files: File[]): Observable<AgentResponse> {
    const formData = new FormData();
    files.forEach((file, index) => {
      formData.append(`images`, file);
    });
    return this.http.post<AgentResponse>(`${this.baseUrl}/agent/vehicles/upload/exterior`, formData, {
      headers: this.getAuthHeaders(),
    });
  }

  uploadVehicleDocuments(files: File[]): Observable<AgentResponse> {
    const formData = new FormData();
    files.forEach((file, index) => {
      formData.append(`documents`, file);
    });
    return this.http.post<AgentResponse>(`${this.baseUrl}/agent/vehicles/upload/documents`, formData, {
      headers: this.getAuthHeaders(),
    });
  }

  getAgentBookings(): Observable<Booking[]> {
    return this.http.get<{ success: boolean; data: Booking[] }>(`${this.baseUrl}/agent/bookings`, {
      headers: this.getAuthHeaders(),
    }).pipe(
      map(response => response.data || [])
    );
  }

  getAgentReviews(): Observable<Review[]> {
    return this.http.get<{ success: boolean; data: Review[] }>(`${this.baseUrl}/agent/reviews`, {
      headers: this.getAuthHeaders(),
    }).pipe(
      map(response => response.data || [])
    );
  }

  approveBooking(bookingId: string): Observable<AgentResponse> {
    return this.http.put<AgentResponse>(`${this.baseUrl}/agent/bookings/${bookingId}/approve`, {}, {
      headers: this.getAuthHeaders(),
    });
  }

  declineBooking(bookingId: string): Observable<AgentResponse> {
    return this.http.put<AgentResponse>(`${this.baseUrl}/agent/bookings/${bookingId}/decline`, {}, {
      headers: this.getAuthHeaders(),
    });
  }

  markBookingAsActive(bookingId: string): Observable<AgentResponse> {
    return this.http.put<AgentResponse>(`${this.baseUrl}/agent/bookings/${bookingId}/activate`, {}, {
      headers: this.getAuthHeaders(),
    });
  }

  markBookingAsCompleted(bookingId: string): Observable<AgentResponse> {
    return this.http.put<AgentResponse>(`${this.baseUrl}/agent/bookings/${bookingId}/complete`, {}, {
      headers: this.getAuthHeaders(),
    });
  }

  deleteVehicle(vehicleId: string): Observable<AgentResponse> {
    return this.http.delete<AgentResponse>(`${this.baseUrl}/agent/vehicles/${vehicleId}`, {
      headers: this.getAuthHeaders(),
    });
  }

  getAgentEarnings(): Observable<EarningsStats> {
    return this.http.get<{ success: boolean; data: EarningsStats }>(`${this.baseUrl}/agent/earnings`, {
      headers: this.getAuthHeaders(),
    }).pipe(
      map(response => response.data)
    );
  }

  getVehicleEarnings(): Observable<VehicleEarnings[]> {
    return this.http.get<{ success: boolean; data: VehicleEarnings[] }>(`${this.baseUrl}/agent/vehicles/earnings`, {
      headers: this.getAuthHeaders(),
    }).pipe(
      map(response => response.data || [])
    );
  }
} 