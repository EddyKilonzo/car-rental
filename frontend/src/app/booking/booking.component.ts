import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../services/auth/auth.service';
import { VehicleService } from '../services/vehicle.service';
import { BookingService } from '../services/booking.service';
import { ToastService } from '../services/toast.service';

interface Vehicle {
  id: string;
  make: string;
  model: string;
  year: number;
  vehicleType: string;
  fuelType: string;
  transmission: string;
  seats: number;
  doors: number;
  color: string;
  pricePerDay: number;
  pricePerWeek?: number;
  pricePerMonth?: number;
  status: string;
  isActive: boolean;
  description?: string;
  features?: string[];
  mainImageUrl?: string;
  galleryImages?: string[];
  interiorImages?: string[];
  exteriorImages?: string[];
  userId: string;
  user?: {
    id: string;
    name: string;
    email: string;
  };
}

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface BookingResponse {
  success: boolean;
  data?: unknown;
  message?: string;
}

@Component({
  selector: 'app-booking',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './booking.component.html',
  styleUrls: ['./booking.component.css']
})
export class BookingComponent implements OnInit {
  private authService = inject(AuthService);
  private vehicleService = inject(VehicleService);
  private bookingService = inject(BookingService);
  private toastService = inject(ToastService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private fb = inject(FormBuilder);

  vehicle: Vehicle | null = null;
  bookingForm: FormGroup;
  isLoading = false;
  error = '';
  currentUser: User | null = null;
  totalPrice = 0;
  totalDays = 0;
  minDate = new Date().toISOString().split('T')[0];

  constructor() {
    this.bookingForm = this.fb.group({
      startDate: ['', [Validators.required]],
      endDate: ['', [Validators.required]],
      pickupLocation: ['', [Validators.required]],
      returnLocation: ['', [Validators.required]],
      notes: ['']
    });
  }

  ngOnInit() {
    this.currentUser = this.authService.getCurrentUser();
    
    if (!this.currentUser) {
      this.router.navigate(['/login']);
      return;
    }

    if (this.currentUser.role === 'ADMIN') {
      this.toastService.showError('Admins cannot book vehicles. Please use a customer account.');
      this.router.navigate(['/vehicles']);
      return;
    }

    if (this.currentUser.role === 'AGENT') {
      this.toastService.showError('Agents cannot book vehicles. You can only post and manage vehicles.');
      this.router.navigate(['/vehicles']);
      return;
    }

    this.loadVehicleDetails();
    this.setupFormListeners();
  }
  /**
   * Loads vehicle details based on the vehicle ID from the route parameters.
   * If the vehicle is not available for booking, sets an error message.
   */
  loadVehicleDetails(): void {
    const vehicleId = this.route.snapshot.paramMap.get('vehicleId');
    if (!vehicleId) {
      this.error = 'Vehicle ID not found';
      return;
    }

    this.isLoading = true;
    this.vehicleService.getVehicleById(vehicleId).subscribe({
      next: (response) => {
        this.vehicle = response;
        this.isLoading = false;
        
        if (this.vehicle?.status !== 'AVAILABLE') {
          this.error = 'This vehicle is not available for booking';
          this.isLoading = false;
        }
      },
      error: (error) => {
        console.error('Error loading vehicle details:', error);
        this.error = 'Failed to load vehicle details';
        this.isLoading = false;
      }
    });
  }
  /**
   * Sets up form listeners to calculate total price when dates change.
   * Also validates the date inputs to ensure they are logical and within business rules.
   */

  setupFormListeners(): void {
    // Listen to date changes to calculate total price
    this.bookingForm.get('startDate')?.valueChanges.subscribe(() => {
      this.calculateTotalPrice();
    });

    this.bookingForm.get('endDate')?.valueChanges.subscribe(() => {
      this.calculateTotalPrice();
    });
  }
  /**
   * Calculates the total price based on the selected start and end dates.
   * If the dates are invalid or not selected, sets totalDays and totalPrice to zero.
   */

  calculateTotalPrice(): void {
    const startDate = this.bookingForm.get('startDate')?.value;
    const endDate = this.bookingForm.get('endDate')?.value;

    if (startDate && endDate && this.vehicle) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
      
      if (days > 0) {
        this.totalDays = days;
        this.totalPrice = days * this.vehicle.pricePerDay;
      } else {
        this.totalDays = 0;
        this.totalPrice = 0;
      }
    }
  }
  /**
   * Validates the selected start and end dates to ensure they are logical and within business rules.
   * Returns true if valid, false otherwise.
   */
  validateDates(): boolean {
    const startDate = this.bookingForm.get('startDate')?.value;
    const endDate = this.bookingForm.get('endDate')?.value;

    if (!startDate || !endDate) {
      this.toastService.showError('Please select both start and end dates');
      return false;
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Check if dates are valid
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      this.toastService.showError('Please select valid dates');
      return false;
    }

    if (start < today) {
      this.toastService.showError('Start date cannot be in the past');
      return false;
    }

    if (end <= start) {
      this.toastService.showError('End date must be after start date');
      return false;
    }

    // Check if booking is for more than 30 days (optional business rule)
    const daysDiff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    if (daysDiff > 30) {
      this.toastService.showError('Bookings cannot exceed 30 days');
      return false;
    }

    return true;
  }
  /**
   * Submits the booking form after validation.
   * If valid, sends the booking data to the server and handles the response.
   */
  onSubmit(): void {
    if (this.bookingForm.invalid) {
      this.toastService.showError('Please fill in all required fields');
      return;
    }

    if (!this.validateDates()) {
      return;
    }

    if (!this.vehicle) {
      this.toastService.showError('Vehicle information not available');
      return;
    }

    this.isLoading = true;

    const bookingData = {
      ...this.bookingForm.value,
      vehicleId: this.vehicle.id
    };
    
    this.bookingService.createBooking(bookingData).subscribe({
      next: (response: BookingResponse) => {
        if (response.success) {
          this.toastService.showSuccess('Booking created successfully! Please wait for agent approval.');
          this.router.navigate(['/my-bookings']);
        } else {
          this.error = response.message || 'Failed to create booking';
          this.toastService.showError(this.error);
          this.isLoading = false;
        }
      },
      error: (error) => {
        console.error('Error creating booking:', error);
        this.error = error.error?.message || 'Failed to create booking';
        this.toastService.showError(this.error);
        this.isLoading = false;
      }
    });
  }
  /**
   * Navigates back to the vehicle details page.
   */
  goBack(): void {
    this.router.navigate(['/vehicle-details', this.vehicle?.id]);
  }
  /**
   * Formats the price in Kenyan Shillings (KES) currency format.
   * @param price The price to format.
   * @returns Formatted price string.
   */
  getFormattedPrice(price: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'KES'
    }).format(price);
  }
  /**
   * Formats a date string to a more readable format.
   * @param date The date string to format.
   * @returns Formatted date string.
   */
  getFormattedDate(date: string): string {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }
  /**
   * Returns a string representation of the calculation for display.
   * If totalDays and vehicle are set, it returns a formatted string.
   * Otherwise, it returns an empty string.
   */
  getCalculationDisplay(): string {
    if (this.totalDays > 0 && this.vehicle) {
      return `${this.totalDays} × ${this.getFormattedPrice(this.vehicle.pricePerDay)}`;
    }
    return '';
  }
  /**
   * Returns a string representation of the total price for display.
   * If totalDays is greater than zero, it returns the formatted price.
   * Otherwise, it returns a message prompting the user to select dates.
   */
  getTotalDisplay(): string {
    if (this.totalDays > 0) {
      return this.getFormattedPrice(this.totalPrice);
    }
    return 'Select dates to see total';
  }
  /**
   * Handles image loading errors by logging the error and setting a placeholder image.
   * If the image is from Cloudinary, it logs potential issues.
   * @param event The image error event.
   */
  onImageError(event: Event): void {
    const target = event.target as HTMLImageElement;
    console.error('Image failed to load:', target?.src);
    
    if (target) {
      const originalSrc = target.src;
      console.log('Original image source:', originalSrc);
      
      if (originalSrc && originalSrc.includes('cloudinary')) {
        console.error('Cloudinary image failed to load. Possible issues:');
        console.error('- CORS policy');
        console.error('- Invalid URL format');
        console.error('- Network connectivity');
        console.error('- Cloudinary service issues');
      }
      
      // Use a more reliable placeholder
      target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAwIiBoZWlnaHQ9IjQwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjBmMGYwIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIyMCIgZmlsbD0iIzY2NjY2NiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkltYWdlIE5vdCBGb3VuZDwvdGV4dD48L3N2Zz4=';
    }
  }
  /**
   * Handles successful image loading by logging the image URL.
   * @param imageUrl The URL of the loaded image.
   */
  onImageLoad(imageUrl: string): void {
    console.log('Image loaded successfully:', imageUrl);
  }
} 