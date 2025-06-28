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

  getToasts() {
    return this.toasts.asObservable();
  }

  showSuccess(message: string, duration: number = 3000) {
    this.showToast(message, 'success', duration);
  }

  showError(message: string, duration: number = 5000) {
    this.showToast(message, 'error', duration);
  }

  showWarning(message: string, duration: number = 4000) {
    this.showToast(message, 'warning', duration);
  }

  showInfo(message: string, duration: number = 3000) {
    this.showToast(message, 'info', duration);
  }

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

  removeToast(id: string) {
    const currentToasts = this.toasts.value;
    const filteredToasts = currentToasts.filter(toast => toast.id !== id);
    this.toasts.next(filteredToasts);
  }

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }
} 