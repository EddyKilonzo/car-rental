import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth/auth.service';
import { BookingService } from '../services/booking.service';
import { ToastService } from '../services/toast.service';
import { ReviewFormComponent } from '../review-form/review-form.component';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface BookingResponse {
  success: boolean;
  data: Booking | Booking[];
  message?: string;
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
  vehicle: {
    id: string;
    make: string;
    model: string;
    year: number;
    mainImageUrl?: string;
  };
  reviews?: {
    id: string;
    rating: number;
    comment: string;
    createdAt: string;
    userId: string;
  }[];
}

@Component({
  selector: 'app-my-bookings',
  standalone: true,
  imports: [CommonModule, FormsModule, ReviewFormComponent],
  templateUrl: './my-bookings.component.html',
  styleUrls: ['./my-bookings.component.css']
})
export class MyBookingsComponent implements OnInit {
  private authService = inject(AuthService);
  private bookingService = inject(BookingService);
  private toastService = inject(ToastService);
  private router = inject(Router);

  bookings: Booking[] = [];
  isLoading = false;
  error = '';
  currentUser: User | null = null;
  activeTab: 'bookings' | 'reviews' = 'bookings';
  showReviewForm = false;
  selectedBooking: Booking | null = null;

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
    this.bookingService.getUserBookings().subscribe({
      next: (response: BookingResponse) => {
        this.isLoading = false;
        if (response.success) {
          this.bookings = Array.isArray(response.data) ? response.data : (response.data ? [response.data] : []);
        } else {
          this.error = response.message || 'Failed to load bookings';
        }
      },
      error: (error: unknown) => {
        this.isLoading = false;
        this.error = 'Failed to load bookings';
        console.error('Error loading bookings:', error);
      }
    });
  }

  cancelBooking(bookingId: string) {
    this.bookingService.cancelBooking(bookingId).subscribe({
      next: (response: CancelBookingResponse) => {
        if (response.success) {
          this.toastService.showSuccess('Booking cancelled successfully');
          this.loadBookings(); // Reload to update status
        } else {
          this.toastService.showError('Failed to cancel booking');
        }
      },
      error: (error) => {
        this.toastService.showError('Failed to cancel booking');
        console.error('Error cancelling booking:', error);
      }
    });
  }

  canCancelBooking(booking: Booking): boolean {
    return booking.status === 'PENDING' || booking.status === 'CONFIRMED';
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'PENDING': return 'status-pending';
      case 'CONFIRMED': return 'status-confirmed';
      case 'ACTIVE': return 'status-active';
      case 'COMPLETED': return 'status-completed';
      case 'CANCELLED': return 'status-cancelled';
      default: return 'status-unknown';
    }
  }

  getStatusText(status: string): string {
    switch (status) {
      case 'PENDING': return 'Pending';
      case 'CONFIRMED': return 'Confirmed';
      case 'ACTIVE': return 'Active';
      case 'COMPLETED': return 'Completed';
      case 'CANCELLED': return 'Cancelled';
      default: return 'Unknown';
    }
  }

  getFormattedDate(date: string): string {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  getFormattedPrice(price: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'KES'
    }).format(price);
  }

  getBookingsWithReviews(): Booking[] {
    return this.bookings.filter(booking => this.getUserReview(booking));
  }

  getBookingsWithoutReviews(): Booking[] {
    return this.bookings.filter(booking => !this.getUserReview(booking) && booking.status === 'COMPLETED');
  }

  getUserReview(booking: Booking) {
    if (!booking.reviews || !this.currentUser) return null;
    return booking.reviews.find(review => review.userId === this.currentUser!.id);
  }

  navigateToVehicles() {
    this.router.navigate(['/vehicles']);
  }

  navigateToProfile() {
    this.router.navigate(['/profile']);
  }

  openReviewForm(booking: Booking) {
    this.selectedBooking = booking;
    this.showReviewForm = true;
  }

  closeReviewForm() {
    this.showReviewForm = false;
    this.selectedBooking = null;
  }

  onReviewSubmitted() {
    this.closeReviewForm();
    this.loadBookings(); // Reload to get the new review
    this.toastService.showSuccess('Review submitted successfully!');
  }

  viewReview(booking: Booking) {
    // For now, just show a toast with the review details
    const review = this.getUserReview(booking);
    if (review) {
      const stars = '★'.repeat(review.rating) + '☆'.repeat(5 - review.rating);
      const message = `Rating: ${stars}\n${review.comment ? `Comment: ${review.comment}` : 'No comment provided'}`;
      this.toastService.showInfo(message);
    }
  }

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
} 