import { Component, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth/auth.service';
import { ToastService } from '../../services/toast.service';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css']
})
export class NavbarComponent implements OnInit {
  isLoggedIn = false;
  userRole = '';
  userName = '';
  currentUser: User | null = null;
  currentRoute = '';
  isMobileMenuOpen = false;

  constructor(
    private authService: AuthService,
    private router: Router,
    private toastService: ToastService
  ) {}

  ngOnInit() {
    this.updateAuthStatus();
    this.router.events.subscribe(() => {
      this.updateAuthStatus();
      this.currentRoute = this.router.url;
      // Close mobile menu on route change
      this.closeMobileMenu();
    });
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event) {
    // Close mobile menu when clicking outside
    const target = event.target as HTMLElement;
    if (!target.closest('.navbar') && this.isMobileMenuOpen) {
      this.closeMobileMenu();
    }
  }

  updateAuthStatus() {
    this.isLoggedIn = this.authService.isLoggedIn();
    if (this.isLoggedIn) {
      // Get user data from localStorage
      const userStr = localStorage.getItem('user');
      if (userStr) {
        try {
          const user = JSON.parse(userStr);
          this.currentUser = user;
          this.userRole = user?.role || '';
          this.userName = user?.name || '';
        } catch (error) {
          console.error('Error parsing user data:', error);
          this.currentUser = null;
          this.userRole = '';
          this.userName = '';
        }
      }
    } else {
      this.currentUser = null;
      this.userRole = '';
      this.userName = '';
    }
  }

  toggleMobileMenu() {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
    console.log('Mobile menu toggled:', this.isMobileMenuOpen); // Debug log
  }

  closeMobileMenu() {
    this.isMobileMenuOpen = false;
  }

  logout() {
    this.authService.logout();
    this.toastService.showSuccess('You have been logged out successfully.');
    this.router.navigate(['/']);
    this.updateAuthStatus();
    this.closeMobileMenu();
  }

  onProfileClick() {
    if (this.isLoggedIn) {
      this.router.navigate(['/profile']);
    } else {
      this.router.navigate(['/login']);
    }
  }

  isAdmin(): boolean {
    return this.userRole === 'ADMIN';
  }

  isAgent(): boolean {
    return this.userRole === 'AGENT';
  }

  isCustomer(): boolean {
    return this.userRole === 'CUSTOMER';
  }

  isAdminRoute(): boolean {
    return this.currentRoute.startsWith('/admin');
  }

  isAgentRoute(): boolean {
    return this.currentRoute.startsWith('/agent');
  }
} 