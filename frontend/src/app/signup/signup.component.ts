import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth/auth.service';
import { ToastService } from '../services/toast.service';

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './signup.component.html',
  styleUrls: ['./signup.component.css']
})
export class SignupComponent {
  private authService = inject(AuthService);
  private router = inject(Router);
  private toastService = inject(ToastService);

  userData = {
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    role: 'CUSTOMER'
  };
  isLoading = false;

  onSubmit() {
    // Validation
    if (!this.userData.name || !this.userData.email || !this.userData.password || !this.userData.confirmPassword) {
      this.toastService.showError('Please fill in all required fields.');
      return;
    }
    // Check if passwords match and meet length requirements
    if (this.userData.password !== this.userData.confirmPassword) {
      this.toastService.showError('Passwords do not match. Please try again.');
      return;
    }
    // Check password length
    if (this.userData.password.length < 6) {
      this.toastService.showError('Password must be at least 6 characters long.');
      return;
    }
    // Validate email format
    if (!this.isValidEmail(this.userData.email)) {
      this.toastService.showError('Please enter a valid email address.');
      return;
    }

    this.isLoading = true;

    // Remove confirmPassword before sending to API
    const { confirmPassword, ...signupData } = this.userData;
    void confirmPassword;
    // Call the registration service
    this.authService.register(signupData).subscribe({
      next: (response) => {
        this.isLoading = false;
        if (response.success && response.data) {
          this.toastService.showSuccess('Account created successfully! Welcome to our car rental service.');
          this.router.navigate(['/login']);
        } else {
          this.toastService.showError(response.message || 'Registration failed. Please try again.');
        }
      },
      error: (error) => {
        this.isLoading = false;
        if (error.status === 409) {
          this.toastService.showError('An account with this email already exists. Please use a different email or try logging in.');
        } else if (error.status === 400) {
          this.toastService.showError('Please check your information and try again.');
        } else if (error.status === 0) {
          this.toastService.showError('Unable to connect to server. Please check your internet connection.');
        } else {
          this.toastService.showError('Registration failed. Please try again later.');
        }
        console.error('Registration error:', error);
      }
    });
  }
  // Helper function to validate email format
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}
