import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ReviewService, CreateReviewRequest } from '../services/review.service';
import { ToastService } from '../services/toast.service';

@Component({
  selector: 'app-review-form',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './review-form.component.html',
  styleUrls: ['./review-form.component.css']
})
export class ReviewFormComponent implements OnInit {
  @Input() bookingId: string = '';
  @Input() vehicleName: string = '';
  @Output() reviewSubmitted = new EventEmitter<void>();
  @Output() reviewCancelled = new EventEmitter<void>();

  reviewForm: FormGroup;
  isSubmitting = false;
  hoverRating = 0;

  constructor(
    private fb: FormBuilder,
    private reviewService: ReviewService,
    private toastService: ToastService
  ) {
    this.reviewForm = this.fb.group({
      rating: [0, [Validators.required, Validators.min(1), Validators.max(5)]],
      comment: ['', [Validators.maxLength(500)]]
    });
  }

  ngOnInit() {
    // Set the booking ID in the form
    this.reviewForm.patchValue({
      bookingId: this.bookingId
    });
  }

  setRating(rating: number) {
    this.reviewForm.patchValue({ rating });
  }

  getRatingText(rating: number): string {
    const ratings = {
      1: 'Poor',
      2: 'Fair',
      3: 'Good',
      4: 'Very Good',
      5: 'Excellent'
    };
    return ratings[rating as keyof typeof ratings] || '';
  }

  onSubmit() {
    if (this.reviewForm.invalid) {
      this.toastService.showError('Please provide a rating');
      return;
    }

    this.isSubmitting = true;

    const reviewData: CreateReviewRequest = {
      bookingId: this.bookingId,
      rating: this.reviewForm.value.rating,
      comment: this.reviewForm.value.comment
    };

    this.reviewService.createReview(reviewData).subscribe({
      next: (response) => {
        this.isSubmitting = false;
        this.toastService.showSuccess('Review submitted successfully!');
        this.reviewSubmitted.emit();
      },
      error: (error) => {
        this.isSubmitting = false;
        console.error('Error submitting review:', error);
        this.toastService.showError(error.error?.message || 'Failed to submit review');
      }
    });
  }

  onCancel() {
    this.reviewCancelled.emit();
  }
} 