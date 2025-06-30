import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth/auth.service';
import { AgentService } from '../../services/agent.service';
import { ToastService } from '../../services/toast.service';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

// Import interfaces from agent service to avoid conflicts
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
      mainImageUrl?: string;
    };
  };
}

interface Vehicle {
  id: string;
  make: string;
  model: string;
  year: number;
  mainImageUrl?: string;
}

interface AgentResponse {
  success: boolean;
  data: unknown;
  message?: string;
}

interface BookingActionResponse {
  success: boolean;
  message?: string;
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

@Component({
  selector: 'app-agent-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './agent-dashboard.component.html',
  styleUrls: ['./agent-dashboard.component.css']
})
export class AgentDashboardComponent implements OnInit {
  private authService = inject(AuthService);
  private agentService = inject(AgentService);
  private toastService = inject(ToastService);
  private router = inject(Router);

  bookings: Booking[] = [];
  reviews: Review[] = [];
  isLoading = false;
  isProcessing = false;
  currentUser: User | null = null;
  activeTab: 'bookings' | 'reviews' = 'bookings';

  ngOnInit() {
    this.currentUser = this.authService.getCurrentUser();
    
    if (!this.currentUser) {
      this.router.navigate(['/login']);
      return;
    }

    if (this.currentUser.role !== 'AGENT') {
      this.toastService.showError('Access denied. Agent privileges required.');
      this.router.navigate(['/']);
      return;
    }

    console.log('Agent user:', this.currentUser);
    this.loadBookings();
    this.loadReviews();
  }

  loadBookings() {
    this.isLoading = true;
    console.log('Loading agent bookings...');
    
    this.agentService.getAgentBookings().subscribe({
      next: (bookings: Booking[]) => {
        console.log('Agent bookings loaded:', bookings.length);
        this.isLoading = false;
        this.bookings = bookings;
      },
      error: (error: unknown) => {
        this.isLoading = false;
        this.toastService.showError('Failed to load bookings');
        console.error('Error loading bookings:', error);
      }
    });
  }

  loadReviews() {
    this.agentService.getAgentReviews().subscribe({
      next: (reviews: Review[]) => {
        console.log('Agent reviews loaded:', reviews.length);
        this.reviews = reviews;
      },
      error: (error: unknown) => {
        console.error('Error loading reviews:', error);
      }
    });
  }

  approveBooking(bookingId: string) {
    this.isProcessing = true;
    
    this.agentService.approveBooking(bookingId).subscribe({
      next: (response: BookingActionResponse) => {
        this.isProcessing = false;
        if (response.success) {
          this.toastService.showSuccess('Booking approved successfully');
          this.loadBookings();
        } else {
          this.toastService.showError('Failed to approve booking');
        }
      },
      error: (error: unknown) => {
        this.isProcessing = false;
        this.toastService.showError('Failed to approve booking');
        console.error('Error approving booking:', error);
      }
    });
  }

  declineBooking(bookingId: string) {
    this.isProcessing = true;
    
    this.agentService.declineBooking(bookingId).subscribe({
      next: (response: BookingActionResponse) => {
        this.isProcessing = false;
        if (response.success) {
          this.toastService.showSuccess('Booking declined successfully');
          this.loadBookings();
        } else {
          this.toastService.showError('Failed to decline booking');
        }
      },
      error: (error: unknown) => {
        this.isProcessing = false;
        this.toastService.showError('Failed to decline booking');
        console.error('Error declining booking:', error);
      }
    });
  }

  markAsActive(bookingId: string) {
    this.isProcessing = true;
    
    this.agentService.markBookingAsActive(bookingId).subscribe({
      next: (response: BookingActionResponse) => {
        this.isProcessing = false;
        if (response.success) {
          this.toastService.showSuccess('Rental started successfully');
          this.loadBookings();
        } else {
          this.toastService.showError('Failed to start rental');
        }
      },
      error: (error: unknown) => {
        this.isProcessing = false;
        this.toastService.showError('Failed to start rental');
        console.error('Error starting rental:', error);
      }
    });
  }

  markAsCompleted(bookingId: string) {
    this.isProcessing = true;
    
    this.agentService.markBookingAsCompleted(bookingId).subscribe({
      next: (response: BookingActionResponse) => {
        this.isProcessing = false;
        if (response.success) {
          this.toastService.showSuccess('Rental completed successfully');
          this.loadBookings();
          this.loadReviews(); // Reload reviews in case new ones were added
        } else {
          this.toastService.showError('Failed to complete rental');
        }
      },
      error: (error: unknown) => {
        this.isProcessing = false;
        this.toastService.showError('Failed to complete rental');
        console.error('Error completing rental:', error);
      }
    });
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

  onImageError(event: Event): void {
    const target = event.target as HTMLImageElement;
    if (target) {
      target.src = 'assets/images/default-car.jpg';
    }
  }
}
