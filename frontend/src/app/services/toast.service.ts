import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
}

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  private toasts = new BehaviorSubject<Toast[]>([]);
  // Expose the toasts as an observable
  getToasts() {
    return this.toasts.asObservable();
  }
  // Show methods for different types of toasts
  showSuccess(message: string, duration = 2000) {
    this.showToast(message, 'success', duration);
  }

  showError(message: string, duration = 3000) {
    this.showToast(message, 'error', duration);
  }

  showWarning(message: string, duration = 3000) {
    this.showToast(message, 'warning', duration);
  }

  showInfo(message: string, duration = 3000) {
    this.showToast(message, 'info', duration);
  }
  // Private method to create and show a toast
  private showToast(message: string, type: Toast['type'], duration: number) {
    const toast: Toast = {
      id: this.generateId(),
      message,
      type,
      duration
    };

    const currentToasts = this.toasts.value;
    const newToasts = [...currentToasts, toast];
    this.toasts.next(newToasts);

    // Auto remove after duration
    setTimeout(() => {
      this.removeToast(toast.id);
    }, duration);
  }
  // Method to remove a toast by id
  removeToast(id: string): void {
    const currentToasts = this.toasts.value;
    const filteredToasts = currentToasts.filter(toast => toast.id !== id);
    this.toasts.next(filteredToasts);
  }
  // Generate a unique ID for each toast
  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }
} 