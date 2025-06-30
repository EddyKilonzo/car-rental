import { Component, OnInit, HostListener, inject } from '@angular/core';
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
  private authService = inject(AuthService);
  private router = inject(Router);
  private toastService = inject(ToastService);

  isLoggedIn = false;
  userRole = '';
  userName = '';
  currentUser: User | null = null;
  currentRoute = '';
  isMobileMenuOpen = false;

  ngOnInit(): void {
    this.updateAuthStatus();
    this.router.events.subscribe(() => {
      this.updateAuthStatus();
      this.currentRoute = this.router.url;
      // Close mobile menu on route change
      this.closeMobileMenu();
    });
  }
  /**
   * 
   * @param event Event triggered when clicking anywhere in the document
   * Listens for clicks on the document to close the mobile menu when clicking outside of it
   */
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event): void {
    // Close mobile menu when clicking outside
    const target = event.target as HTMLElement;
    if (!target.closest('.navbar') && this.isMobileMenuOpen) {
      this.closeMobileMenu();
    }
  }
  /**
   * Updates the authentication status and retrieves user data from localStorage.
   */

  updateAuthStatus(): void {
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
  /**
   * Toggles the mobile menu open/close state.
   * Logs the current state of the mobile menu for debugging purposes.
   */

  toggleMobileMenu(): void {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
    console.log('Mobile menu toggled:', this.isMobileMenuOpen); // Debug log
  }
  // Closes the mobile menu.
  closeMobileMenu(): void {
    this.isMobileMenuOpen = false;
  }
  // Logs the current user data for debugging purposes.
  logout(): void {
    this.authService.logout();
    this.toastService.showSuccess('You have been logged out successfully.');
    this.router.navigate(['/']);
    this.updateAuthStatus();
    this.closeMobileMenu();
  }
  // Navigates to the profile page if logged in, otherwise redirects to login page.
  onProfileClick(): void {
    if (this.isLoggedIn) {
      this.router.navigate(['/profile']);
    } else {
      this.router.navigate(['/login']);
    }
  }
  // Checks if the user has admin privileges.
  isAdmin(): boolean {
    return this.userRole === 'ADMIN';
  }
  // Checks if the user has agent privileges.
  isAgent(): boolean {
    return this.userRole === 'AGENT';
  }
  // Checks if the user has customer privileges.
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