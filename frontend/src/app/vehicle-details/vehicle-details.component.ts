import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../services/auth/auth.service';
import { VehicleService } from '../services/vehicle.service';
import { ToastService } from '../services/toast.service';
import { ReviewService, Review } from '../services/review.service';

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

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

@Component({
  selector: 'app-vehicle-details',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './vehicle-details.component.html',
  styleUrls: ['./vehicle-details.component.css']
})
export class VehicleDetailsComponent implements OnInit {
  private authService = inject(AuthService);
  private vehicleService = inject(VehicleService);
  private reviewService = inject(ReviewService);
  private toastService = inject(ToastService);
  private route = inject(ActivatedRoute);
  router = inject(Router);

  vehicle: Vehicle | null = null;
  vehicleReviews: Review[] = [];
  isLoading = false;
  error = '';
  isAdmin = false;
  isAgent = false;
  currentUser: User | null = null;

  constructor() {}

  ngOnInit() {
    this.currentUser = this.authService.getCurrentUser();
    this.isAdmin = this.currentUser?.role === 'ADMIN';
    this.isAgent = this.currentUser?.role === 'AGENT';
    
    this.loadVehicleDetails();
    this.loadVehicleReviews();
  }

  loadVehicleDetails() {
    const vehicleId = this.route.snapshot.paramMap.get('id');
    if (!vehicleId) {
      this.error = 'Vehicle ID not found';
      return;
    }

    this.isLoading = true;
    this.vehicleService.getVehicleById(vehicleId).subscribe({
      next: (response) => {
        console.log('Vehicle details response:', response);
        console.log('Vehicle mainImageUrl:', response?.mainImageUrl);
        console.log('Vehicle galleryImages:', response?.galleryImages);
        console.log('Main image URL type:', typeof response?.mainImageUrl);
        console.log('Main image URL length:', response?.mainImageUrl?.length);
        
        // Check if the URL is valid
        if (response?.mainImageUrl) {
          try {
            const url = new URL(response.mainImageUrl);
            console.log('Valid URL:', url.href);
            console.log('URL protocol:', url.protocol);
            console.log('URL hostname:', url.hostname);
          } catch (e) {
            console.error('Invalid URL format:', response.mainImageUrl);
          }
        }
        
        this.vehicle = response;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading vehicle details:', error);
        this.error = 'Failed to load vehicle details';
        this.isLoading = false;
      }
    });
  }

  loadVehicleReviews() {
    const vehicleId = this.route.snapshot.paramMap.get('id');
    if (!vehicleId) return;
    this.reviewService.getVehicleReviews(vehicleId).subscribe({
      next: (response) => {
        this.vehicleReviews = response;
      },
      error: (error) => {
        this.vehicleReviews = [];
      }
    });
  }

  onBookClick() {
    if (!this.currentUser) {
      this.router.navigate(['/login']);
      return;
    }

    if (this.currentUser.role === 'ADMIN') {
      this.toastService.showError('Admins cannot book vehicles. Please use a customer account.');
      return;
    }

    if (this.currentUser.role === 'AGENT') {
      this.toastService.showError('Agents cannot book vehicles. You can only post and manage vehicles.');
      return;
    }

    // Navigate to booking form or show booking modal
    if (this.vehicle) {
      this.router.navigate(['/booking', this.vehicle.id]);
    }
  }

  canBookVehicle(): boolean {
    return !this.isAdmin && !this.isAgent && !!this.currentUser;
  }

  getBookingButtonText(): string {
    if (this.isAdmin) {
      return 'Admin Access - Cannot Book';
    }
    if (this.isAgent) {
      return 'Agent Access - Cannot Book';
    }
    if (!this.currentUser) {
      return 'Login to Book';
    }
    return 'Book Now';
  }

  getBookingButtonClass(): string {
    if (this.isAdmin || this.isAgent) {
      return 'book-btn disabled';
    }
    if (!this.currentUser) {
      return 'book-btn login-required';
    }
    return 'book-btn';
  }

  isMyVehicle(): boolean {
    return this.isAgent && this.vehicle?.userId === this.currentUser?.id;
  }

  getVehicleStatusClass(): string {
    if (!this.vehicle) return '';
    
    switch (this.vehicle.status) {
      case 'AVAILABLE':
        return 'status-available';
      case 'RENTED':
        return 'status-rented';
      case 'MAINTENANCE':
        return 'status-maintenance';
      case 'OUT_OF_SERVICE':
        return 'status-out-of-service';
      default:
        return '';
    }
  }

  getVehicleStatusText(): string {
    if (!this.vehicle) return '';
    
    switch (this.vehicle.status) {
      case 'AVAILABLE':
        return 'Available';
      case 'RENTED':
        return 'Currently Rented';
      case 'MAINTENANCE':
        return 'Under Maintenance';
      case 'OUT_OF_SERVICE':
        return 'Out of Service';
      default:
        return this.vehicle.status;
    }
  }

  onImageError(event: Event): void {
    const target = event.target as HTMLImageElement;
    console.error('Image failed to load:', target?.src);
    console.error('Image error details:', event);
    
    if (target) {
      // Try to determine the issue
      const originalSrc = target.src;
      console.log('Original image source:', originalSrc);
      
      if (originalSrc && originalSrc.includes('cloudinary')) {
        console.error('Cloudinary image failed to load. Possible issues:');
        console.error('- CORS policy');
        console.error('- Invalid URL format');
        console.error('- Network connectivity');
        console.error('- Cloudinary service issues');
      }
      
      // Use a more reliable placeholder
      target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAwIiBoZWlnaHQ9IjQwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjBmMGYwIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIyMCIgZmlsbD0iIzY2NjY2NiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkltYWdlIE5vdCBGb3VuZDwvdGV4dD48L3N2Zz4=';
    }
  }

  onImageLoad(imageUrl: string): void {
    console.log('Image loaded successfully:', imageUrl);
    console.log('Image element:', event?.target);
  }

  goBack(): void {
    this.router.navigate(['/vehicles']);
  }

  getInitials(name: string): string {
    if (!name) return '';
    const parts = name.trim().split(' ');
    if (parts.length === 1) return parts[0][0].toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
}
