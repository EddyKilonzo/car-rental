import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-landing-page',
  imports: [
    CommonModule,
    RouterModule,
    MatButtonModule,
    MatCardModule,
    MatIconModule
  ],
  templateUrl: './landing-page.component.html',
  styleUrl: './landing-page.component.css'
})
export class LandingPageComponent {
  features = [
    {
      icon: 'directions_car',
      title: 'Wide Selection',
      description: 'Choose from our extensive fleet of vehicles'
    },
    {
      icon: 'schedule',
      title: '24/7 Support',
      description: 'Round-the-clock customer support'
    },
    {
      icon: 'security',
      title: 'Safe & Secure',
      description: 'All vehicles are insured and regularly maintained'
    }
  ];
}
