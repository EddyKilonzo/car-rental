import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AdminService } from '../../services/admin.service';
import { ToastService } from '../../services/toast.service';

interface SystemStats {
  users: {
    total: number;
    customers: number;
    agents: number;
    admins: number;
  };
  vehicles: {
    total: number;
    available: number;
    rented: number;
    maintenance: number;
    outOfService: number;
  };
  bookings: {
    total: number;
    active: number;
    pending: number;
    completed: number;
    cancelled: number;
  };
  reviews: {
    total: number;
    averageRating: number;
  };
  revenue: {
    total: number;
    averagePerBooking: number;
  };
}

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.css']
})
export class AdminDashboardComponent implements OnInit {
  private adminService = inject(AdminService);
  private toastService = inject(ToastService);

  stats: SystemStats | null = null;
  isLoading = false;
  
  ngOnInit(): void {
    this.loadSystemStats();
  }

  loadSystemStats(): void {
    this.isLoading = true;
    this.adminService.getSystemStats().subscribe({
      next: (stats) => {
        this.stats = stats;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading system stats:', error);
        this.toastService.showError('Failed to load system statistics');
        this.isLoading = false;
      }
    });
  }
  /**
   * Formats a currency amount.
   * @param amount The amount to format.
   * @returns The formatted currency string.
   */

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  }

  formatRating(rating: number): string {
    return rating.toFixed(1);
  }
} 