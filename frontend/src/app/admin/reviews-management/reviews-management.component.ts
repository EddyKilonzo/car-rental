import { Component, OnInit, inject } from '@angular/core';
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
      mainImageUrl?: string;
    };
  };
}

interface RatingDistribution {
  rating: number;
  count: number;
}

interface ReviewStats {
  totalReviews: number;
  averageRating: number;
  ratingDistribution: RatingDistribution[];
  recentReviews: Review[];
}

interface PaginationData {
  pages: number;
  total: number;
}

interface ReviewsResponse {
  success: boolean;
  data: {
    reviews: Review[];
    pagination: PaginationData;
  };
}

interface ReviewStatsResponse {
  success: boolean;
  data: ReviewStats;
}

interface DeleteReviewResponse {
  success: boolean;
  message?: string;
}

@Component({
  selector: 'app-reviews-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './reviews-management.component.html',
  styleUrls: ['./reviews-management.component.css']
})
export class ReviewsManagementComponent implements OnInit {
  private adminService = inject(AdminService);
  private toastService = inject(ToastService);

  reviews: Review[] = [];
  reviewStats: ReviewStats | null = null;
  isLoading = false;
  currentPage = 1;
  totalPages = 1;
  totalReviews = 0;
  minRating?: number;
  maxRating?: number;

  ngOnInit(): void {
    this.loadReviewStats();
    this.loadReviews();
  }

  loadReviewStats(): void {
    this.adminService.getReviewStats().subscribe({
      next: (response: ReviewStatsResponse) => {
        if (response.success) {
          this.reviewStats = response.data;
        }
      },
      error: (error) => {
        console.error('Error loading review stats:', error);
      }
    });
  }
  /**
   * Loads all reviews with optional filters for rating range.
   * Uses pagination to fetch reviews in chunks.
   */

  loadReviews(): void {
    this.isLoading = true;
    this.adminService.getAllReviews(this.currentPage, 10, this.minRating, this.maxRating).subscribe({
      next: (response: ReviewsResponse) => {
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

  onFilterChange(): void {
    this.currentPage = 1;
    this.loadReviews();
  }

  clearFilters(): void {
    this.minRating = undefined;
    this.maxRating = undefined;
    this.currentPage = 1;
    this.loadReviews();
  }

  onPageChange(page: number): void {
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

  onImageError(event: Event): void {
    const target = event.target as HTMLImageElement;
    target.src = 'assets/hero.png';
  }

  /**
   * 
   * @param reviewId ID of the review to be deleted
   * Deletes the review with the given ID and refreshes the review list and stats.
   */

  deleteReview(reviewId: string): void {
    this.adminService.deleteReview(reviewId).subscribe({
      next: (response: DeleteReviewResponse) => {
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