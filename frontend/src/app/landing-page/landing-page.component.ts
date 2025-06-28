import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

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
export class LandingPageComponent {
  reviews = [
    {
      name: 'Jane Doe',
      photo: '/assets/review1.jpg',
      text: 'The car was spotless and the service was top-notch. Highly recommend!',
      rating: 5
    },
    {
      name: 'John Smith',
      photo: '/assets/review2.jpg',
      text: 'Booking was easy and the staff were very helpful. Will rent again!',
      rating: 4
    },
    {
      name: 'Emily Johnson',
      photo: '/assets/review3.jpg',
      text: 'Great selection of vehicles and very fair prices.',
      rating: 5
    }
  ];
  currentReview = 0;

  prevReview() {
    this.currentReview = (this.currentReview - 1 + this.reviews.length) % this.reviews.length;
  }

  nextReview() {
    this.currentReview = (this.currentReview + 1) % this.reviews.length;
  }
}
