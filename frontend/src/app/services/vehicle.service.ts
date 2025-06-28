import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class VehicleService {
  private baseUrl = 'http://localhost:3000';

  constructor(private http: HttpClient) {}

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('accessToken');
    return new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });
  }

  getVehicleById(vehicleId: string): Observable<any> {
    return this.http.get(`${this.baseUrl}/vehicles/${vehicleId}`);
  }

  getAllVehicles(): Observable<any> {
    return this.http.get(`${this.baseUrl}/vehicles`);
  }

  searchVehicles(params: any): Observable<any> {
    let httpParams = new HttpParams();
    for (const key in params) {
      if (params.hasOwnProperty(key)) {
        httpParams = httpParams.set(key, params[key]);
      }
    }
    return this.http.get(`${this.baseUrl}/vehicles`, {
      headers: this.getAuthHeaders(),
      params: httpParams,
    });
  }

  createVehicle(vehicleData: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/agent/vehicles`, vehicleData, {
      headers: this.getAuthHeaders(),
    });
  }

  updateVehicle(vehicleId: string, vehicleData: any): Observable<any> {
    return this.http.put(`${this.baseUrl}/agent/vehicles/${vehicleId}`, vehicleData, {
      headers: this.getAuthHeaders(),
    });
  }
} 