import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth/auth.service';
import { UserService } from '../services/user.service';
import { UploadService } from '../services/upload.service';
import { ToastService } from '../services/toast.service';
import { AgentService } from '../services/agent.service';
import { User } from '../shared/types/user.types';



interface ProfileUpdateData {
  name?: string | null;
  phone?: string | null;
  licenseNumber?: string | null;
  dateOfBirth?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  zipCode?: string | null;
  country?: string | null;
}

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css']
})
export class ProfileComponent implements OnInit {
  private authService = inject(AuthService);
  private userService = inject(UserService);
  private uploadService = inject(UploadService);
  private toastService = inject(ToastService);
  private agentService = inject(AgentService);
  router = inject(Router);

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
    licenseNumber: '',
    dateOfBirth: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    country: ''
  };

  profileCompletion = 0;
  missingFields: string[] = [];

  // Add missing properties
  isUpdating = false;
  isCompleting = false;
  showCompleteProfileForm = false;

  ngOnInit() {
    this.currentUser = this.authService.getCurrentUser();
    
    if (!this.currentUser) {
      this.router.navigate(['/login']);
      return;
    }

    this.loadUserProfile();
    this.calculateProfileCompletion();
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
      // Format dateOfBirth for HTML date input (YYYY-MM-DD)
      let formattedDateOfBirth = '';
      if (this.currentUser.dateOfBirth) {
        try {
          const date = new Date(this.currentUser.dateOfBirth);
          if (!isNaN(date.getTime())) {
            formattedDateOfBirth = date.toISOString().split('T')[0]; // YYYY-MM-DD format
          }
        } catch (error) {
          console.warn('Error formatting dateOfBirth:', error);
        }
      }

      this.profileData = {
        name: this.currentUser.name || '',
        phone: this.currentUser.phone || '',
        licenseNumber: this.currentUser.licenseNumber || '',
        dateOfBirth: formattedDateOfBirth,
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
    if (!this.currentUser) {
      this.toastService.showError('User not found.');
      return;
    }

    // Check required fields
    if (!this.profileData.name || !this.profileData.name.trim()) {
      this.toastService.showError('Name is required.');
      return;
    }

    // Check date format if provided
    if (this.profileData.dateOfBirth && this.profileData.dateOfBirth.trim()) {
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(this.profileData.dateOfBirth)) {
        this.toastService.showError('Date of birth must be in YYYY-MM-DD format.');
        return;
      }

      // Check that it's a valid date
      const date = new Date(this.profileData.dateOfBirth);
      if (isNaN(date.getTime())) {
        this.toastService.showError('Please enter a valid date of birth.');
        return;
      }
    }

    this.isUpdating = true;

    const updateData = {
      name: this.profileData.name.trim(),
      phone: this.profileData.phone?.trim() || null,
      licenseNumber: this.profileData.licenseNumber?.trim() || null,
      dateOfBirth: this.profileData.dateOfBirth?.trim() || null,
      address: this.profileData.address?.trim() || null,
      city: this.profileData.city?.trim() || null,
      state: this.profileData.state?.trim() || null,
      zipCode: this.profileData.zipCode?.trim() || null,
      country: this.profileData.country?.trim() || null,
    };

    this.userService.updateProfile(updateData).subscribe({
      next: (response) => {
        this.isUpdating = false;
        if (response.success) {
          this.currentUser = response.data;
          this.toastService.showSuccess('Profile updated successfully!');
          this.isEditing = false;
          this.calculateProfileCompletion();
        } else {
          this.toastService.showError('Failed to update profile. Please try again.');
        }
      },
      error: (error) => {
        this.isUpdating = false;
        console.error('Profile update error:', error);
        this.toastService.showError('Failed to update profile. Please try again.');
      }
    });
  }

  completeProfile() {
    // Profile completion is handled through the regular updateProfile method
    this.toastService.showInfo('Please use the edit profile form to complete your profile information.');
  }

  deactivateAccount() {
    if (!this.currentUser) {
      return;
    }

    this.isLoading = true;
    this.userService.deactivateProfile().subscribe({
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
    if (!this.currentUser) {
      return;
    }

    this.isLoading = true;
    this.userService.deleteProfilePermanently().subscribe({
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
      next: () => {
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
  onProfileImageSelected(event: Event) {
    const target = event.target as HTMLInputElement;
    const file = target.files?.[0];
    if (file) {
      // Check file type
      if (!file.type.startsWith('image/')) {
        this.toastService.showError('Please select a valid image file.');
        return;
      }

      // Check file size (max 5MB)
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
    reader.onload = (e: ProgressEvent<FileReader>) => {
      this.profileImagePreview = e.target?.result as string;
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
      
      // The backend endpoint already updates the user profile with the image URL
      // We just need to update the local user data
      if (uploadResult && uploadResult.url) {
        console.log('Profile image uploaded successfully:', uploadResult.url);
        // Reload user profile to get updated data
        this.loadUserProfile();
        this.toastService.showSuccess('Profile image uploaded successfully!');
        this.selectedProfileImage = null;
        this.profileImagePreview = null;
      } else {
        console.error('Unexpected upload result structure:', uploadResult);
        this.toastService.showError('Image uploaded but response format is unexpected. Please try again.');
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

  calculateProfileCompletion() {
    if (!this.currentUser) return;

    const requiredFields = [
      { name: 'Name', value: this.currentUser.name },
      { name: 'Phone', value: this.currentUser.phone },
      { name: 'Address', value: this.currentUser.address },
      { name: 'City', value: this.currentUser.city },
      { name: 'State', value: this.currentUser.state },
      { name: 'Zip Code', value: this.currentUser.zipCode },
      { name: 'Country', value: this.currentUser.country }
    ];

    const completedFields = requiredFields.filter(field => field.value && field.value.trim() !== '');
    this.profileCompletion = Math.round((completedFields.length / requiredFields.length) * 100);
    
    this.missingFields = requiredFields
      .filter(field => !field.value || field.value.trim() === '')
      .map(field => field.name);
  }

  isProfileComplete(): boolean {
    if (!this.currentUser) return false;
    
    // Check if required profile fields are filled (same as booking components)
    const requiredFields = [
      this.currentUser.name,
      this.currentUser.phone,
      this.currentUser.address,
      this.currentUser.city,
      this.currentUser.state,
      this.currentUser.zipCode,
      this.currentUser.country
    ];
    
    return requiredFields.every(field => field && field.trim() !== '');
  }

  scrollToProfileForm() {
    const profileFormCard = document.querySelector('.profile-form-card');
    if (profileFormCard) {
      profileFormCard.scrollIntoView({ behavior: 'smooth' });
    }
  }

  navigateToMyBookings() {
    this.router.navigate(['/my-bookings']);
  }

  navigateToVehicles() {
    this.router.navigate(['/vehicles']);
  }
}
