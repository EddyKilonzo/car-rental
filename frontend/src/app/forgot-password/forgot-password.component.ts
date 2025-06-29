import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth/auth.service';
import { ToastService } from '../services/toast.service';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './forgot-password.component.html',
  styleUrls: ['./forgot-password.component.css']
})
export class ForgotPasswordComponent {
  email: string = '';
  isLoading: boolean = false;
  resetCode: string = '';
  newPassword: string = '';
  confirmPassword: string = '';
  step: 'email' | 'code' | 'password' = 'email';

  constructor(
    private authService: AuthService,
    private toastService: ToastService,
    private router: Router
  ) {}

  onSubmitEmail(): void {
    if (!this.email) {
      this.toastService.showError('Please enter your email address');
      return;
    }

    this.isLoading = true;
    this.authService.forgotPassword(this.email).subscribe({
      next: (response) => {
        this.toastService.showSuccess('Reset code sent to your email');
        this.step = 'code';
        this.isLoading = false;
      },
      error: (error) => {
        this.toastService.showError(error.error?.message || 'Failed to send reset code');
        this.isLoading = false;
      }
    });
  }

  onSubmitCode(): void {
    if (!this.resetCode) {
      this.toastService.showError('Please enter the reset code');
      return;
    }

    this.isLoading = true;
    this.authService.verifyResetCode(this.email, this.resetCode).subscribe({
      next: (response) => {
        this.toastService.showSuccess('Code verified successfully');
        this.step = 'password';
        this.isLoading = false;
      },
      error: (error) => {
        this.toastService.showError(error.error?.message || 'Invalid reset code');
        this.isLoading = false;
      }
    });
  }

  onSubmitPassword(): void {
    if (!this.newPassword || !this.confirmPassword) {
      this.toastService.showError('Please fill in all fields');
      return;
    }

    if (this.newPassword !== this.confirmPassword) {
      this.toastService.showError('Passwords do not match');
      return;
    }

    if (this.newPassword.length < 6) {
      this.toastService.showError('Password must be at least 6 characters');
      return;
    }

    this.isLoading = true;
    this.authService.resetPassword(this.email, this.resetCode, this.newPassword).subscribe({
      next: (response) => {
        this.toastService.showSuccess('Password reset successfully');
        this.router.navigate(['/login']);
      },
      error: (error) => {
        this.toastService.showError(error.error?.message || 'Failed to reset password');
        this.isLoading = false;
      }
    });
  }

  goBack(): void {
    if (this.step === 'code') {
      this.step = 'email';
      this.resetCode = '';
    } else if (this.step === 'password') {
      this.step = 'code';
      this.newPassword = '';
      this.confirmPassword = '';
    }
  }
} 