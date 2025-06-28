import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth/auth.service';
import { UserService } from '../services/user.service';
import { UploadService } from '../services/upload.service';
import { ToastService } from '../services/toast.service';
import { AgentService } from '../services/agent.service';

interface User {
  id: string;
  email: string;
  name: string;
  phone?: string | null;
  role: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  licenseNumber?: string | null;
  dateOfBirth?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  zipCode?: string | null;
  country?: string | null;
  isVerified?: boolean;
  profileImageUrl?: string | null;
  licenseDocumentUrl?: string | null;
}

interface ProfileUpdateData {
  name?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
}

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css']
})
export class ProfileComponent implements OnInit {
  currentUser: User | null = null;
  isEditing = false;
  isLoading = false;
  agentApplicationPending = false;
  applicationStatus: 'PENDING' | 'APPROVED' | 'REJECTED' | 'NOT_APPLIED' | null = null;
  applicationMessage = '';

  // Image upload properties
  selectedProfileImage: File | null = null;
  profileImagePreview: string | null = null;
  isUploadingImage = false;

  // Add document property for template access
  document = document;

  profileData: ProfileUpdateData = {
    name: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    country: ''
  };

  constructor(
    private authService: AuthService,
    private userService: UserService,
    private uploadService: UploadService,
    private toastService: ToastService,
    private agentService: AgentService,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadUserProfile();
  }

  loadUserProfile() {
    if (!this.authService.isLoggedIn()) {
      this.router.navigate(['/login']);
      return;
    }

    this.isLoading = true;
    this.userService.getProfile().subscribe({
      next: (response) => {
        this.isLoading = false;
        if (response.success) {
          this.currentUser = response.data;
          this.populateProfileData();
          this.loadApplicationStatus();
          this.toastService.showSuccess('Profile loaded successfully!');
        }
      },
      error: (error) => {
        this.isLoading = false;
        this.toastService.showError('Unable to load your profile. Please try refreshing the page.');
        console.error('Profile load error:', error);
      }
    });
  }

  populateProfileData() {
    if (this.currentUser) {
      this.profileData = {
        name: this.currentUser.name || '',
        phone: this.currentUser.phone || '',
        address: this.currentUser.address || '',
        city: this.currentUser.city || '',
        state: this.currentUser.state || '',
        zipCode: this.currentUser.zipCode || '',
        country: this.currentUser.country || ''
      };
    }
  }

  toggleEdit() {
    this.isEditing = !this.isEditing;
    if (!this.isEditing) {
      this.populateProfileData(); // Reset to original data
      this.toastService.showInfo('Edit mode cancelled. No changes were saved.');
    } else {
      this.toastService.showInfo('Edit mode enabled. Make your changes and click Save.');
    }
  }

  updateProfile() {
    if (!this.currentUser) return;

    // Validate required fields
    if (!this.profileData.name || this.profileData.name.trim() === '') {
      this.toastService.showError('Full name is required. Please enter your name.');
      return;
    }

    this.isLoading = true;

    this.userService.updateProfile(this.profileData).subscribe({
      next: (response) => {
        this.isLoading = false;
        if (response.success) {
          this.currentUser = response.data;
          this.isEditing = false;
          this.toastService.showSuccess('Profile updated successfully! Your information has been saved.');
        }
      },
      error: (error) => {
        this.isLoading = false;
        if (error.status === 400) {
          this.toastService.showError('Invalid data provided. Please check your information and try again.');
        } else if (error.status === 401) {
          this.toastService.showError('Session expired. Please log in again to update your profile.');
        } else if (error.status === 403) {
          this.toastService.showError('You do not have permission to update this profile.');
        } else if (error.status === 404) {
          this.toastService.showError('Profile not found. Please contact support.');
        } else {
          this.toastService.showError('Failed to update profile. Please check your connection and try again.');
        }
        console.error('Profile update error:', error);
      }
    });
  }

  deactivateAccount() {
    if (!this.currentUser || !confirm('Are you sure you want to deactivate your account? This action can be reversed by contacting support.')) {
      return;
    }

    this.isLoading = true;
    this.userService.updateProfileById(this.currentUser.id, { isActive: false }).subscribe({
      next: (response) => {
        this.isLoading = false;
        if (response.success) {
          this.toastService.showSuccess('Account deactivated successfully. You have been logged out.');
          setTimeout(() => {
            this.authService.logout();
            this.router.navigate(['/']);
          }, 2000);
        }
      },
      error: (error) => {
        this.isLoading = false;
        this.toastService.showError('Failed to deactivate account. Please try again or contact support.');
        console.error('Deactivate error:', error);
      }
    });
  }

  deleteAccount() {
    if (!this.currentUser || !confirm('Are you sure you want to permanently delete your account? This action cannot be undone and all your data will be lost.')) {
      return;
    }

    this.isLoading = true;
    this.userService.deleteUser(this.currentUser.id).subscribe({
      next: (response) => {
        this.isLoading = false;
        if (response.success) {
          this.toastService.showSuccess('Account deleted successfully. Thank you for using our service.');
          setTimeout(() => {
            this.authService.logout();
            this.router.navigate(['/']);
          }, 2000);
        }
      },
      error: (error) => {
        this.isLoading = false;
        this.toastService.showError('Failed to delete account. Please try again or contact support.');
        console.error('Delete error:', error);
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

  getMemberSince(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  }

  loadApplicationStatus() {
    if (!this.currentUser || this.currentUser.role !== 'CUSTOMER') {
      return;
    }

    this.agentService.getApplicationStatus().subscribe({
      next: (response) => {
        this.applicationStatus = response.status;
        this.applicationMessage = response.message || '';
        this.agentApplicationPending = response.status === 'PENDING';
      },
      error: (error) => {
        console.error('Error loading application status:', error);
        // Don't show error toast for this as it's not critical
      }
    });
  }

  applyForAgent() {
    if (!this.currentUser || this.currentUser.role !== 'CUSTOMER') {
      this.toastService.showError('Only customers can apply to become agents.');
      return;
    }

    this.isLoading = true;
    this.agentService.applyToBecomeAgent().subscribe({
      next: (response) => {
        this.isLoading = false;
        this.agentApplicationPending = true;
        this.applicationStatus = 'PENDING';
        this.applicationMessage = 'Your agent application is pending review by an administrator.';
        this.toastService.showSuccess('Agent application submitted successfully! An admin will review your request.');
      },
      error: (error) => {
        this.isLoading = false;
        if (error.status === 400) {
          this.toastService.showError('Invalid application. Please check your profile information.');
        } else if (error.status === 403) {
          this.toastService.showError('You are not eligible to apply for agent status.');
        } else {
          this.toastService.showError('Failed to submit application. Please try again.');
        }
        console.error('Agent application error:', error);
      }
    });
  }

  // Profile Image Upload Methods
  onProfileImageSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        this.toastService.showError('Please select a valid image file.');
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        this.toastService.showError('Image size must be less than 5MB.');
        return;
      }

      this.selectedProfileImage = file;
      this.createProfileImagePreview(file);
    }
  }

  createProfileImagePreview(file: File) {
    const reader = new FileReader();
    reader.onload = (e: any) => {
      this.profileImagePreview = e.target.result;
    };
    reader.readAsDataURL(file);
  }

  async uploadProfileImage() {
    if (!this.selectedProfileImage) {
      this.toastService.showError('Please select an image to upload.');
      return;
    }

    this.isUploadingImage = true;

    try {
      const uploadResult = await this.uploadService.uploadProfilePhoto(this.selectedProfileImage).toPromise();
      console.log('Profile image upload result:', uploadResult);
      
      // Update the user's profile image URL in the backend
      if (this.currentUser) {
        const imageUrl = uploadResult.uploadResult?.secure_url || uploadResult.secure_url;
        
        // Update the user's profile with the new image URL
        this.userService.updateProfile({ profileImageUrl: imageUrl }).subscribe({
          next: (response) => {
            if (response.success) {
              this.currentUser = response.data;
              this.toastService.showSuccess('Profile image uploaded successfully!');
              this.selectedProfileImage = null;
              this.profileImagePreview = null;
            }
          },
          error: (error) => {
            console.error('Failed to update profile with image URL:', error);
            this.toastService.showError('Image uploaded but failed to update profile. Please try again.');
          }
        });
      }
      
    } catch (error) {
      console.error('Profile image upload failed:', error);
      this.toastService.showError('Failed to upload profile image. Please try again.');
    } finally {
      this.isUploadingImage = false;
    }
  }

  cancelImageUpload() {
    this.selectedProfileImage = null;
    this.profileImagePreview = null;
  }
}
