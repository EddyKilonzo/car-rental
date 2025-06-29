import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../services/auth/auth.service';
import { UserService } from '../services/user.service';
import { ToastService } from '../services/toast.service';

@Component({
  selector: 'app-landing-page',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule
  ],
  templateUrl: './landing-page.component.html',
  styleUrls: ['./landing-page.component.css']
})
export class LandingPageComponent implements OnInit {
  reviews = [
    {
      name: 'Jane Doe',
      text: 'The car was spotless and the service was top-notch. Highly recommend!',
      rating: 5
    },
    {
      name: 'John Smith',
      text: 'Booking was easy and the staff were very helpful. Will rent again!',
      rating: 4
    },
    {
      name: 'Emily Johnson',
      text: 'Great selection of vehicles and very fair prices.',
      rating: 5
    }
  ];
  currentReview = 0;
  showProfileBanner = false;
  currentUser: any = null;

  constructor(
    private authService: AuthService,
    private userService: UserService,
    private router: Router,
    private toastService: ToastService
  ) {}

  ngOnInit() {
    this.currentUser = this.authService.getCurrentUser();
    if (this.currentUser && this.currentUser.role === 'CUSTOMER') {
      this.checkProfileCompletion();
    }
  }

  private checkProfileCompletion() {
    this.userService.getProfile().subscribe({
      next: (response) => {
        if (response.success) {
          const user = response.data;
          this.authService.updateCurrentUser(user);
          
          // Check if profile is complete
          const requiredFields = [
            user.name,
            user.phone,
            user.address,
            user.city,
            user.state,
            user.zipCode,
            user.country
          ];
          
          const isComplete = requiredFields.every(field => field && field.trim() !== '');
          this.showProfileBanner = !isComplete;
        }
      },
      error: (error) => {
        console.error('Error checking profile:', error);
      }
    });
  }

  completeProfile() {
    this.router.navigate(['/profile']);
  }

  dismissBanner() {
    this.showProfileBanner = false;
  }

  prevReview() {
    this.currentReview = (this.currentReview - 1 + this.reviews.length) % this.reviews.length;
  }

  nextReview() {
    this.currentReview = (this.currentReview + 1) % this.reviews.length;
  }
}
