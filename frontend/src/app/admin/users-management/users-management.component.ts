import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminService } from '../../services/admin.service';
import { ToastService } from '../../services/toast.service';

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
  imports: [CommonModule],
  templateUrl: './users-management.component.html',
  styleUrls: ['./users-management.component.css']
})
export class UsersManagementComponent implements OnInit {
  users: User[] = [];
  isLoading = false;
  processingUserId: string | null = null;

  constructor(
    private adminService: AdminService,
    private toastService: ToastService
  ) {}

  ngOnInit() {
    this.loadUsers();
  }

  loadUsers() {
    this.isLoading = true;
    this.adminService.getAllUsers().subscribe({
      next: (response) => {
        this.isLoading = false;
        this.users = response?.users || [];
      },
      error: (error) => {
        this.isLoading = false;
        this.toastService.showError('Failed to load users.');
        console.error('Error loading users:', error);
      }
    });
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

  updateUserRole(userId: string, newRole: string) {
    this.processingUserId = userId;
    this.adminService.updateUserRole(userId, newRole).subscribe({
      next: (response) => {
        this.processingUserId = null;
        this.toastService.showSuccess(`User role updated to ${newRole} successfully!`);
        this.loadUsers(); // Reload the list
      },
      error: (error) => {
        this.processingUserId = null;
        this.toastService.showError('Failed to update user role.');
        console.error('Error updating user role:', error);
      }
    });
  }

  deleteUser(userId: string, userName: string) {
    if (!confirm(`Are you sure you want to delete user "${userName}"? This action cannot be undone.`)) {
      return;
    }

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

  getRoleOptions(currentRole: string): string[] {
    const roles = ['CUSTOMER', 'AGENT', 'ADMIN'];
    return roles.filter(role => role !== currentRole);
  }
} 