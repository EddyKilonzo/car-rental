import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth/auth.service';
import { AgentService } from '../../services/agent.service';
import { ToastService } from '../../services/toast.service';

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
    licensePlate: string;
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

@Component({
  selector: 'app-agent-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './agent-dashboard.component.html',
  styleUrls: ['./agent-dashboard.component.css']
})
export class AgentDashboardComponent implements OnInit {
  bookings: Booking[] = [];
  reviews: Review[] = [];
  isLoading = false;
  isProcessing = false;
  currentUser: any = null;
  activeTab: 'bookings' | 'reviews' = 'bookings';

  constructor(
    private authService: AuthService,
    private agentService: AgentService,
    private toastService: ToastService,
    public router: Router
  ) {}

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
    this.loadAgentVehicles();
  }

  loadBookings() {
    this.isLoading = true;
    console.log('Loading agent bookings...');
    
    this.agentService.getAgentBookings().subscribe({
      next: (response: any) => {
        console.log('Agent bookings response:', response);
        this.isLoading = false;
        if (response.success) {
          this.bookings = response.data || [];
          console.log('Bookings loaded:', this.bookings);
        } else {
          this.toastService.showError('Failed to load bookings');
          console.error('Failed to load bookings:', response);
        }
      },
      error: (error: any) => {
        this.isLoading = false;
        this.toastService.showError('Failed to load bookings');
        console.error('Error loading bookings:', error);
      }
    });
  }

  loadReviews() {
    this.agentService.getAgentReviews().subscribe({
      next: (response: any) => {
        if (response.success) {
          this.reviews = response.data || [];
        } else {
          console.error('Failed to load reviews');
        }
      },
      error: (error: any) => {
        console.error('Error loading reviews:', error);
      }
    });
  }

  loadAgentVehicles() {
    this.agentService.getAgentVehicles().subscribe({
      next: (response: any) => {
        console.log('Agent vehicles response:', response);
        if (response.success) {
          console.log('Agent has vehicles:', response.data?.length || 0);
        }
      },
      error: (error: any) => {
        console.error('Error loading agent vehicles:', error);
      }
    });
  }

  approveBooking(bookingId: string) {
    this.isProcessing = true;
    
    this.agentService.approveBooking(bookingId).subscribe({
      next: (response: any) => {
        this.isProcessing = false;
        if (response.success) {
          this.toastService.showSuccess('Booking approved successfully');
          this.loadBookings();
        } else {
          this.toastService.showError('Failed to approve booking');
        }
      },
      error: (error: any) => {
        this.isProcessing = false;
        this.toastService.showError('Failed to approve booking');
        console.error('Error approving booking:', error);
      }
    });
  }

  declineBooking(bookingId: string) {
    if (confirm('Are you sure you want to decline this booking?')) {
      this.isProcessing = true;
      
      this.agentService.declineBooking(bookingId).subscribe({
        next: (response: any) => {
          this.isProcessing = false;
          if (response.success) {
            this.toastService.showSuccess('Booking declined successfully');
            this.loadBookings();
          } else {
            this.toastService.showError('Failed to decline booking');
          }
        },
        error: (error: any) => {
          this.isProcessing = false;
          this.toastService.showError('Failed to decline booking');
          console.error('Error declining booking:', error);
        }
      });
    }
  }

  markAsActive(bookingId: string) {
    this.isProcessing = true;
    
    this.agentService.markBookingAsActive(bookingId).subscribe({
      next: (response: any) => {
        this.isProcessing = false;
        if (response.success) {
          this.toastService.showSuccess('Rental started successfully');
          this.loadBookings();
        } else {
          this.toastService.showError('Failed to start rental');
        }
      },
      error: (error: any) => {
        this.isProcessing = false;
        this.toastService.showError('Failed to start rental');
        console.error('Error starting rental:', error);
      }
    });
  }

  markAsCompleted(bookingId: string) {
    this.isProcessing = true;
    
    this.agentService.markBookingAsCompleted(bookingId).subscribe({
      next: (response: any) => {
        this.isProcessing = false;
        if (response.success) {
          this.toastService.showSuccess('Rental completed successfully');
          this.loadBookings();
          this.loadReviews(); // Reload reviews in case new ones were added
        } else {
          this.toastService.showError('Failed to complete rental');
        }
      },
      error: (error: any) => {
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

  onImageError(event: any): void {
    const target = event.target as HTMLImageElement;
    if (target) {
      target.src = 'assets/images/default-car.jpg';
    }
  }
}
