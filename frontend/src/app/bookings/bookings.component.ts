import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth/auth.service';
import { BookingService } from '../services/booking.service';
import { ToastService } from '../services/toast.service';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface CancelBookingResponse {
  success: boolean;
  message?: string;
}

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
  private authService = inject(AuthService);
  private bookingService = inject(BookingService);
  private toastService = inject(ToastService);
  private router = inject(Router);

  bookings: Booking[] = [];
  isLoading = false;
  error = '';
  currentUser: User | null = null;

  // Computed properties for template
  get activeBookingsCount(): number {
    return this.bookings.filter(b => b.status === 'ACTIVE').length;
  }

  get pendingBookingsCount(): number {
    return this.bookings.filter(b => b.status === 'PENDING').length;
  }

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    
    if (!this.currentUser) {
      this.router.navigate(['/login']);
      return;
    }

    this.loadBookings();
  }
  // Loads all bookings for the current user.
  loadBookings(): void {
    this.isLoading = true;
    this.bookingService.getAgentBookings().subscribe({
      next: (bookings: Booking[]) => {
        this.isLoading = false;
        this.bookings = bookings || [];
      },
      error: (error) => {
        this.isLoading = false;
        this.error = 'Failed to load bookings';
        console.error('Error loading bookings:', error);
      }
    });
  }
  // Cancels a booking by its ID.
  cancelBooking(bookingId: string) {
    this.bookingService.cancelBooking(bookingId).subscribe({
      next: (response: CancelBookingResponse) => {
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
  /**
   * Gets the CSS class for the booking status.
   * @param status 
   * @returns   CSS class string based on the booking status.
   */

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
  /**
   * Returns a user-friendly status text based on the booking status.
   * @param status The booking status string.
   * @returns A user-friendly status text.
   */
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
  /**
   * Formats the price in Kenyan Shillings (KES) currency format.
   * @param price The price to format.
   * @returns Formatted price string.
   */

  getFormattedPrice(price: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'KES'
    }).format(price);
  }
  /**
   * Formats a date string to a more readable format.
   * @param date The date string to format.
   * @returns Formatted date string.
   */
  getFormattedDate(date: string): string {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }
  /**
   * Returns a string representation of the calculation for display.
   * If totalDays and vehicle are set, it returns a formatted string.
   * Otherwise, it returns an empty string.
   */
  getDuration(startDate: string, endDate: string): number {
    const start = new Date(startDate);
    const end = new Date(endDate);
    return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  }
  /**
   * @param booking The booking object to check.
   * Checks if the booking can be cancelled based on its status.
   * @returns 
   */
  canCancelBooking(booking: Booking): boolean {
    return booking.status === 'PENDING' || booking.status === 'CONFIRMED';
  }
  /**
   * Navigates to the vehicle details page for the given vehicle ID.
   * @param vehicleId The ID of the vehicle to view details for.
   */
  goToVehicleDetails(vehicleId: string) {
    this.router.navigate(['/vehicle-details', vehicleId]);
  }
  /**
   * Navigates back to the profile page.
   */
  goBack() {
    this.router.navigate(['/profile']);
  }
  /**
   * Handles image loading errors by logging the error and setting a placeholder image.
   * If the image is from Cloudinary, it logs potential issues.
   * @param event The image error event.
   */
  onImageError(event: Event): void {
    const target = event.target as HTMLImageElement;
    console.error('Image failed to load:', target?.src);
    
    if (target) {
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

  // Navigation methods for template
  navigateToVehicles(): void {
    this.router.navigate(['/vehicles']);
  }
} 