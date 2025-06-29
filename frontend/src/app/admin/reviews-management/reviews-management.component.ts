import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../services/admin.service';
import { ToastService } from '../../services/toast.service';

interface Review {
  id: string;
  rating: number;
  comment: string;
  createdAt: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
  booking: {
    id: string;
    vehicle: {
      id: string;
      make: string;
      model: string;
      year: number;
      licensePlate: string;
    };
  };
}

interface ReviewStats {
  totalReviews: number;
  averageRating: number;
  ratingDistribution: any[];
  recentReviews: any[];
}

@Component({
  selector: 'app-reviews-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './reviews-management.component.html',
  styleUrls: ['./reviews-management.component.css']
})
export class ReviewsManagementComponent implements OnInit {
  reviews: Review[] = [];
  reviewStats: ReviewStats | null = null;
  isLoading = false;
  currentPage = 1;
  totalPages = 1;
  totalReviews = 0;
  minRating?: number;
  maxRating?: number;

  constructor(
    private adminService: AdminService,
    private toastService: ToastService
  ) {}

  ngOnInit() {
    this.loadReviewStats();
    this.loadReviews();
  }

  loadReviewStats() {
    this.adminService.getReviewStats().subscribe({
      next: (response: any) => {
        if (response.success) {
          this.reviewStats = response.data;
        }
      },
      error: (error) => {
        console.error('Error loading review stats:', error);
      }
    });
  }

  loadReviews() {
    this.isLoading = true;
    this.adminService.getAllReviews(this.currentPage, 10, this.minRating, this.maxRating).subscribe({
      next: (response: any) => {
        this.isLoading = false;
        if (response.success) {
          this.reviews = response.data.reviews || [];
          this.totalPages = response.data.pagination.pages;
          this.totalReviews = response.data.pagination.total;
        } else {
          this.toastService.showError('Failed to load reviews');
        }
      },
      error: (error) => {
        this.isLoading = false;
        this.toastService.showError('Failed to load reviews');
        console.error('Error loading reviews:', error);
      }
    });
  }

  onFilterChange() {
    this.currentPage = 1;
    this.loadReviews();
  }

  clearFilters() {
    this.minRating = undefined;
    this.maxRating = undefined;
    this.currentPage = 1;
    this.loadReviews();
  }

  onPageChange(page: number) {
    this.currentPage = page;
    this.loadReviews();
  }

  getStars(rating: number): string {
    return '★'.repeat(rating) + '☆'.repeat(5 - rating);
  }

  getFormattedDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  formatRating(rating: number): string {
    return rating.toFixed(1);
  }

  deleteReview(reviewId: string) {
    if (confirm('Are you sure you want to delete this review? This action cannot be undone.')) {
      this.adminService.deleteReview(reviewId).subscribe({
        next: (response: any) => {
          if (response.success) {
            this.toastService.showSuccess('Review deleted successfully');
            this.loadReviews();
            this.loadReviewStats(); // Refresh stats
          } else {
            this.toastService.showError('Failed to delete review');
          }
        },
        error: (error) => {
          this.toastService.showError('Failed to delete review');
          console.error('Error deleting review:', error);
        }
      });
    }
  }
} 