import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth/auth.service';
import { BookingService } from '../services/booking.service';
import { ToastService } from '../services/toast.service';

interface Booking {
  id: string;
  startDate: string;
  endDate: string;
  totalPrice: number;
  status: string;
  pickupLocation?: string;
  returnLocation?: string;
  notes?: string;
  createdAt: string;
  vehicle: {
    id: string;
    make: string;
    model: string;
    year: number;
    mainImageUrl?: string;
    pricePerDay: number;
  };
}

@Component({
  selector: 'app-bookings',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './bookings.component.html',
  styleUrls: ['./bookings.component.css']
})
export class BookingsComponent implements OnInit {
  bookings: Booking[] = [];
  isLoading = false;
  error = '';
  currentUser: any = null;

  // Computed properties for template
  get activeBookingsCount(): number {
    return this.bookings.filter(b => b.status === 'ACTIVE').length;
  }

  get pendingBookingsCount(): number {
    return this.bookings.filter(b => b.status === 'PENDING').length;
  }

  constructor(
    private authService: AuthService,
    private bookingService: BookingService,
    private toastService: ToastService,
    public router: Router
  ) {}

  ngOnInit() {
    this.currentUser = this.authService.getCurrentUser();
    
    if (!this.currentUser) {
      this.router.navigate(['/login']);
      return;
    }

    this.loadBookings();
  }

  loadBookings() {
    this.isLoading = true;
    this.error = '';

    this.bookingService.getUserBookings().subscribe({
      next: (response: any) => {
        this.isLoading = false;
        if (response.success) {
          this.bookings = response.data || [];
        } else {
          this.error = 'Failed to load bookings';
          this.toastService.showError(this.error);
        }
      },
      error: (error) => {
        console.error('Error loading bookings:', error);
        this.error = 'Failed to load bookings';
        this.toastService.showError(this.error);
        this.isLoading = false;
      }
    });
  }

  cancelBooking(bookingId: string) {
    if (confirm('Are you sure you want to cancel this booking?')) {
      this.bookingService.cancelBooking(bookingId).subscribe({
        next: (response: any) => {
          if (response.success) {
            this.toastService.showSuccess('Booking cancelled successfully');
            this.loadBookings(); // Reload the list
          } else {
            this.toastService.showError('Failed to cancel booking');
          }
        },
        error: (error) => {
          console.error('Error cancelling booking:', error);
          this.toastService.showError('Failed to cancel booking');
        }
      });
    }
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'PENDING':
        return 'status-pending';
      case 'CONFIRMED':
        return 'status-confirmed';
      case 'ACTIVE':
        return 'status-active';
      case 'COMPLETED':
        return 'status-completed';
      case 'CANCELLED':
        return 'status-cancelled';
      default:
        return 'status-unknown';
    }
  }

  getStatusText(status: string): string {
    switch (status) {
      case 'PENDING':
        return 'Pending';
      case 'CONFIRMED':
        return 'Confirmed';
      case 'ACTIVE':
        return 'Active';
      case 'COMPLETED':
        return 'Completed';
      case 'CANCELLED':
        return 'Cancelled';
      default:
        return status;
    }
  }

  getFormattedPrice(price: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'KES'
    }).format(price);
  }

  getFormattedDate(date: string): string {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  getDuration(startDate: string, endDate: string): number {
    const start = new Date(startDate);
    const end = new Date(endDate);
    return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  }

  canCancelBooking(booking: Booking): boolean {
    return booking.status === 'PENDING' || booking.status === 'CONFIRMED';
  }

  goToVehicleDetails(vehicleId: string) {
    this.router.navigate(['/vehicle-details', vehicleId]);
  }

  goBack() {
    this.router.navigate(['/profile']);
  }

  onImageError(event: any): void {
    if (event.target) {
      event.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAwIiBoZWlnaHQ9IjQwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjBmMGYwIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIyMCIgZmlsbD0iIzY2NjY2NiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkltYWdlIE5vdCBGb3VuZDwvdGV4dD48L3N2Zz4=';
    }
  }

  // Navigation methods for template
  navigateToVehicles() {
    this.router.navigate(['/vehicles']);
  }
} 