import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AdminService } from '../../services/admin.service';
import { ToastService } from '../../services/toast.service';
import { AuthService } from '../../services/auth/auth.service';

interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  isVerified?: boolean;
  profileImageUrl?: string | null;
}

@Component({
  selector: 'app-users-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './users-management.component.html',
  styleUrls: ['./users-management.component.css']
})
export class UsersManagementComponent implements OnInit {
  private adminService = inject(AdminService);
  private toastService = inject(ToastService);
  private authService = inject(AuthService);

  users: User[] = [];
  filteredUsers: User[] = [];
  isLoading = false;
  processingUserId: string | null = null;
  
  // Filter properties
  nameFilter: string = '';
  roleFilter: string = '';

  /** Inserted by Angular inject() migration for backwards compatibility */
  constructor(...args: unknown[]);

  constructor() {}

  ngOnInit() {
    // Check if user is logged in and is an admin
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser || currentUser.role !== 'ADMIN') {
      this.toastService.showError('Access denied. Admin privileges required.');
      // Redirect to login or home page
      return;
    }
    
    this.loadUsers();
  }

  loadUsers() {
    this.isLoading = true;
    console.log('Loading users...');
    console.log('Current token:', localStorage.getItem('accessToken'));
    
    this.adminService.getAllUsers().subscribe({
      next: (response) => {
        this.isLoading = false;
        console.log('Users API response:', response);
        this.users = response.users || [];
        this.filteredUsers = [...this.users];
        console.log('Loaded users:', this.users);
      },
      error: (error) => {
        this.isLoading = false;
        console.error('Error loading users:', error);
        console.error('Error status:', error.status);
        console.error('Error message:', error.message);
        this.toastService.showError('Failed to load users.');
      }
    });
  }

  applyFilters() {
    this.filteredUsers = this.users.filter(user => {
      const matchesName = !this.nameFilter || 
        user.name.toLowerCase().includes(this.nameFilter.toLowerCase()) ||
        user.email.toLowerCase().includes(this.nameFilter.toLowerCase());
      
      const matchesRole = !this.roleFilter || user.role === this.roleFilter;
      
      return matchesName && matchesRole;
    });
  }

  clearFilters() {
    this.nameFilter = '';
    this.roleFilter = '';
    this.filteredUsers = [...this.users];
  }

  hasActiveFilters(): boolean {
    return this.nameFilter.trim() !== '' || this.roleFilter !== '';
  }

  toggleUserStatus(userId: string, currentStatus: boolean) {
    this.processingUserId = userId;
    this.adminService.toggleUserStatus(userId).subscribe({
      next: (response) => {
        this.processingUserId = null;
        this.toastService.showSuccess(`User ${currentStatus ? 'deactivated' : 'activated'} successfully!`);
        this.loadUsers(); // Reload the list
      },
      error: (error) => {
        this.processingUserId = null;
        this.toastService.showError('Failed to update user status.');
        console.error('Error updating user status:', error);
      }
    });
  }

  deleteUser(userId: string, userName: string) {
    this.processingUserId = userId;
    this.adminService.deleteUser(userId).subscribe({
      next: (response) => {
        this.processingUserId = null;
        this.toastService.showSuccess('User deleted successfully!');
        this.loadUsers(); // Reload the list
      },
      error: (error) => {
        this.processingUserId = null;
        this.toastService.showError('Failed to delete user.');
        console.error('Error deleting user:', error);
      }
    });
  }

  demoteAgent(userId: string, userName: string) {
    this.processingUserId = userId;
    this.adminService.updateUserRole(userId, 'CUSTOMER').subscribe({
      next: (response) => {
        this.processingUserId = null;
        this.toastService.showSuccess(`Agent "${userName}" has been demoted to Customer successfully!`);
        this.loadUsers(); // Reload the list
      },
      error: (error) => {
        this.processingUserId = null;
        this.toastService.showError('Failed to demote agent.');
        console.error('Error demoting agent:', error);
      }
    });
  }

  getRoleDisplayName(role: string): string {
    switch (role) {
      case 'ADMIN': return 'Administrator';
      case 'AGENT': return 'Vehicle Agent';
      case 'CUSTOMER': return 'Customer';
      default: return role;
    }
  }

  getStatusDisplayName(isActive: boolean): string {
    return isActive ? 'Active' : 'Inactive';
  }

  getFormattedDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }
} 