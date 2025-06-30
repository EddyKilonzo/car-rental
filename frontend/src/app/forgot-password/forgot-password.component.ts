import { Component, inject } from '@angular/core';
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
  private authService = inject(AuthService);
  private toastService = inject(ToastService);
  private router = inject(Router);

  email = '';
  isLoading = false;
  resetCode = '';
  newPassword = '';
  confirmPassword = '';
  step: 'email' | 'code' | 'password' = 'email';

  onSubmitEmail(): void {
    if (!this.email) {
      this.toastService.showError('Please enter your email address');
      return;
    }

    this.isLoading = true;
    this.authService.forgotPassword(this.email).subscribe({
      next: () => {
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
  /**
   * Handles the submission of the reset code.
   * @returns void
   */

  onSubmitCode(): void {
    if (!this.resetCode) {
      this.toastService.showError('Please enter the reset code');
      return;
    }

    this.isLoading = true;
    this.authService.verifyResetCode(this.email, this.resetCode).subscribe({
      next: () => {
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
  /**
   * Submits the new password and confirms it matches the confirmation field.
   * Validates the password length and matches before proceeding.
   * @returns void
   * @throws Error if the new password and confirmation do not match, or if the password
   * is less than 6 characters.
   */

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
      next: () => {
        this.toastService.showSuccess('Password reset successfully');
        this.router.navigate(['/login']);
      },
      error: (error) => {
        this.toastService.showError(error.error?.message || 'Failed to reset password');
        this.isLoading = false;
      }
    });
  }
  /// Navigates back to the previous step in the forgot password flow.

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