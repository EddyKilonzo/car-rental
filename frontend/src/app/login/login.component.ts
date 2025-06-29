import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth/auth.service';
import { UserService } from '../services/user.service';
import { ToastService } from '../services/toast.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  credentials = {
    email: '',
    password: ''
  };
  isLoading = false;

  constructor(
    private authService: AuthService,
    private userService: UserService,
    private router: Router,
    private toastService: ToastService
  ) {}

  onSubmit() {
    if (!this.credentials.email || !this.credentials.password) {
      this.toastService.showError('Please enter both email and password.');
      return;
    }

    this.isLoading = true;
    this.authService.login(this.credentials).subscribe({
      next: (response) => {
        this.isLoading = false;
        if (response.success) {
          // Store the token and user data
          localStorage.setItem('accessToken', response.data.accessToken);
          localStorage.setItem('user', JSON.stringify(response.data.user));
          
          this.toastService.showSuccess('Login successful! Welcome back.');
          
          // Check if profile is complete for customers
          if (response.data.user.role === 'CUSTOMER') {
            this.checkProfileCompletion();
          } else {
            this.router.navigate(['/']);
          }
        } else {
          this.toastService.showError(response.message || 'Login failed. Please try again.');
        }
      },
      error: (error) => {
        this.isLoading = false;
        if (error.status === 401) {
          this.toastService.showError('Invalid email or password. Please check your credentials.');
        } else if (error.status === 400) {
          this.toastService.showError('Please provide valid email and password.');
        } else if (error.status === 0) {
          this.toastService.showError('Unable to connect to server. Please check your internet connection.');
        } else {
          this.toastService.showError('Login failed. Please try again later.');
        }
        console.error('Login error:', error);
      }
    });
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
          
          if (!isComplete) {
            this.toastService.showInfo('Please complete your profile to get the best experience.');
            this.router.navigate(['/profile']);
          } else {
            this.router.navigate(['/']);
          }
        } else {
          this.router.navigate(['/']);
        }
      },
      error: (error) => {
        console.error('Error checking profile:', error);
        this.router.navigate(['/']);
      }
    });
  }
}
