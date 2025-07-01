import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../services/auth/auth.service';
import { UploadService } from '../services/upload.service';
import { VehicleService } from '../services/vehicle.service';
import { AgentService } from '../services/agent.service';
import { ToastService } from '../services/toast.service';

// Import Vehicle interface from VehicleService
interface Vehicle {
  id: string;
  make: string;
  model: string;
  year: number;
  licensePlate: string;
  vin: string;
  mileage: number;
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
    avatarUrl?: string;
  };
}

interface VehicleForm {
  make: string;
  model: string;
  year: number;
  licensePlate: string;
  vin: string;
  mileage: number;
  vehicleType: string;
  fuelType: string;
  transmission: string;
  seats: number;
  doors: number;
  color: string;
  pricePerDay: number;
  pricePerWeek?: number;
  pricePerMonth?: number;
  description: string;
  features: string[];
  imageFile?: File;
}

@Component({
  selector: 'app-vehicle-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './vehicle-form.component.html',
  styleUrls: ['./vehicle-form.component.css']
})
export class VehicleFormComponent implements OnInit {
  private authService = inject(AuthService);
  private uploadService = inject(UploadService);
  private vehicleService = inject(VehicleService);
  private agentService = inject(AgentService);
  private toastService = inject(ToastService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  // Vehicle form model
  vehicleForm: VehicleForm = {
    make: '',
    model: '',
    year: new Date().getFullYear(),
    licensePlate: '',
    vin: '',
    mileage: 0,
    vehicleType: '',
    fuelType: '',
    transmission: '',
    seats: 5,
    doors: 5,
    color: '',
    pricePerDay: 0,
    description: '',
    features: []
  };
  // State variables
  isAgent = false;
  isLoading = false;
  selectedFile: File | null = null;
  previewUrl: string | null = null;
  isEditMode = false;
  vehicleId: string | null = null;
  currentImageUrl: string | null = null;
  newFeature = '';
  // Dropdown options
  vehicleTypes = ['SEDAN', 'SUV', 'HATCHBACK', 'COUPE', 'CONVERTIBLE', 'VAN', 'TRUCK', 'LUXURY'];
  fuelTypes = ['PETROL', 'DIESEL', 'ELECTRIC', 'HYBRID', 'LPG'];
  transmissionTypes = ['MANUAL', 'AUTOMATIC'];



  ngOnInit() {
    const currentUser = this.authService.getCurrentUser();
    this.isAgent = currentUser?.role === 'AGENT';
    
    if (!this.isAgent) {
      this.toastService.showError('Access denied. Only agents can add vehicles.');
      this.router.navigate(['/vehicles']);
    }
    // Check for edit mode
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.isEditMode = true;
        this.vehicleId = params['id'];
        this.loadVehicleData(this.vehicleId as string);
      }
    });
  }
  /**
   * Loads vehicle data for editing if in edit mode.
   * @param id The ID of the vehicle to load.
   */
  loadVehicleData(id: string): void {
    this.isLoading = true;
    this.vehicleService.getVehicleById(id).subscribe({
      next: (vehicle: Vehicle) => {
        this.vehicleForm = {
          make: vehicle.make,
          model: vehicle.model,
          year: vehicle.year,
          licensePlate: vehicle.licensePlate,
          vin: vehicle.vin,
          mileage: vehicle.mileage,
          vehicleType: vehicle.vehicleType,
          fuelType: vehicle.fuelType,
          transmission: vehicle.transmission,
          seats: vehicle.seats,
          doors: vehicle.doors,
          color: vehicle.color,
          pricePerDay: vehicle.pricePerDay,
          pricePerWeek: vehicle.pricePerWeek,
          pricePerMonth: vehicle.pricePerMonth,
          description: vehicle.description || '',
          features: vehicle.features || []
        };
        this.currentImageUrl = vehicle.mainImageUrl || null;
        this.previewUrl = this.currentImageUrl;
        this.isLoading = false;
      },
      error: () => {
        this.toastService.showError('Failed to load vehicle data.');
        this.isLoading = false;
      }
    });
  }
  /**
   * Handles file selection for the vehicle image.
   * @param event The file input change event.
   */
  onFileSelected(event: Event): void {
    const target = event.target as HTMLInputElement;
    const file = target.files?.[0];
    if (file) {
      this.selectedFile = file;
      this.createPreview(file);
    }
  }
  /**
   * Creates a preview URL for the selected file.
   * @param file The selected file.
   */
  createPreview(file: File): void {
    const reader = new FileReader();
    reader.onload = (e: ProgressEvent<FileReader>) => {
      this.previewUrl = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  }
  /**
   * Removes the selected file and clears the preview.
   */
  addFeature(): void {
    if (this.newFeature && this.newFeature.trim()) {
      this.vehicleForm.features.push(this.newFeature.trim());
      this.newFeature = ''; // Clear the input after adding
    }
  }
  /**
   * Removes a feature from the vehicle form.
   * @param index The index of the feature to remove.
   */
  removeFeature(index: number): void {
    this.vehicleForm.features.splice(index, 1);
  }

  async onSubmit(): Promise<void> {
    if (!this.isAgent) {
      this.toastService.showError('Only agents can add vehicles.');
      return;
    }

    if (!this.validateForm()) {
      return;
    }

    this.isLoading = true;

    try {
      let imageUrl = this.currentImageUrl || '';
      
      // Only upload image if a file is selected
      if (this.selectedFile) {
        try {
          console.log('Starting image upload for file:', this.selectedFile.name);
          const uploadResult = await this.uploadService.uploadVehicleMainImage(this.selectedFile).toPromise();
          console.log('Raw upload result:', uploadResult);
          console.log('Upload result type:', typeof uploadResult);
          
          if (uploadResult) {
            console.log('Upload result keys:', Object.keys(uploadResult));
            
            // Extract URL from the correct structure (CloudinaryUploadResult)
            imageUrl = uploadResult.secure_url || '';
            console.log('Extracted image URL:', imageUrl);
            console.log('Image upload successful:', uploadResult);
          }
          
          if (!imageUrl) {
            throw new Error('No image URL received from upload');
          }
        } catch (uploadError) {
          console.error('Image upload failed:', uploadError);
          console.error('Upload error details:', {
            message: (uploadError as Error)?.message,
            status: (uploadError as { status?: number })?.status,
            error: (uploadError as { error?: unknown })?.error
          });
          imageUrl = this.currentImageUrl || '';
          this.toastService.showWarning('Image upload failed. Vehicle will be updated without new image.');
        }
      } else if (!this.isEditMode) {
        // If creating a new vehicle and no image is selected, warn the user
        this.toastService.showWarning('Please select a main image for the vehicle.');
        this.isLoading = false;
        return;
      }

      // Create vehicle object
      const vehicleData = {
        make: this.vehicleForm.make,
        model: this.vehicleForm.model,
        year: Number(this.vehicleForm.year),
        licensePlate: this.vehicleForm.licensePlate,
        vin: this.vehicleForm.vin,
        mileage: Number(this.vehicleForm.mileage),
        vehicleType: this.vehicleForm.vehicleType,
        fuelType: this.vehicleForm.fuelType,
        transmission: this.vehicleForm.transmission,
        seats: Number(this.vehicleForm.seats),
        doors: Number(this.vehicleForm.doors),
        color: this.vehicleForm.color,
        pricePerDay: Number(this.vehicleForm.pricePerDay),
        pricePerWeek: this.vehicleForm.pricePerWeek ? Number(this.vehicleForm.pricePerWeek) : undefined,
        pricePerMonth: this.vehicleForm.pricePerMonth ? Number(this.vehicleForm.pricePerMonth) : undefined,
        description: this.vehicleForm.description,
        features: this.vehicleForm.features,
        mainImageUrl: imageUrl || undefined
      };

      console.log('Sending vehicle data:', vehicleData);
      console.log('mainImageUrl value:', vehicleData.mainImageUrl);
      console.log('mainImageUrl type:', typeof vehicleData.mainImageUrl);

      if (this.isEditMode && this.vehicleId) {
        const result = await this.agentService.updateVehicle(this.vehicleId, vehicleData).toPromise();
        console.log('Vehicle update successful:', result);
        this.toastService.showSuccess('Vehicle updated successfully!');
      } else {
        const result = await this.agentService.createVehicle(vehicleData).toPromise();
        console.log('Vehicle creation successful:', result);
        this.toastService.showSuccess('Vehicle added successfully!');
      }
      this.router.navigate(['/vehicles']);
      
    } catch (error) {
      console.error('Error adding vehicle:', error);
      
      // Type guard to check if error is an object with properties
      if (error && typeof error === 'object') {
        const errorObj = error as Record<string, unknown>;
        console.error('Error details:', errorObj['error']);
        console.error('Error message:', errorObj['message']);
        console.error('Error status:', errorObj['status']);
        
        // Show more specific error message if available
        let errorMessage = 'Failed to save vehicle. Please try again.';
        if (errorObj['error'] && typeof errorObj['error'] === 'object' && (errorObj['error'] as Record<string, unknown>)['message']) {
          errorMessage = (errorObj['error'] as Record<string, unknown>)['message'] as string;
        } else if (errorObj['message']) {
          errorMessage = errorObj['message'] as string;
        }
        
        this.toastService.showError(errorMessage);
      } else {
        this.toastService.showError('Failed to save vehicle. Please try again.');
      }
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * Validates the vehicle form fields.
   * @returns {boolean} True if the form is valid, false otherwise.
   */
  validateForm(): boolean {
    console.log('Validating form with values:', this.vehicleForm);
    
    // Check required text fields with trimming
    if (!this.vehicleForm.make?.trim()) {
      console.log('Make validation failed:', this.vehicleForm.make);
      this.toastService.showError('Please enter the vehicle make.');
      return false;
    }
    
    if (!this.vehicleForm.model?.trim()) {
      console.log('Model validation failed:', this.vehicleForm.model);
      this.toastService.showError('Please enter the vehicle model.');
      return false;
    }
    
    if (!this.vehicleForm.licensePlate?.trim()) {
      console.log('License plate validation failed:', this.vehicleForm.licensePlate);
      this.toastService.showError('Please enter the license plate number.');
      return false;
    }
    
    if (!this.vehicleForm.vin?.trim()) {
      console.log('VIN validation failed:', this.vehicleForm.vin);
      this.toastService.showError('Please enter the VIN number.');
      return false;
    }
    
    if (!this.vehicleForm.vehicleType?.trim()) {
      console.log('Vehicle type validation failed:', this.vehicleForm.vehicleType);
      this.toastService.showError('Please select a vehicle type.');
      return false;
    }
    
    if (!this.vehicleForm.fuelType?.trim()) {
      console.log('Fuel type validation failed:', this.vehicleForm.fuelType);
      this.toastService.showError('Please select a fuel type.');
      return false;
    }
    
    if (!this.vehicleForm.transmission?.trim()) {
      console.log('Transmission validation failed:', this.vehicleForm.transmission);
      this.toastService.showError('Please select a transmission type.');
      return false;
    }
    
    if (!this.vehicleForm.color?.trim()) {
      console.log('Color validation failed:', this.vehicleForm.color);
      this.toastService.showError('Please enter the vehicle color.');
      return false;
    }

    // Check numeric fields
    const year = Number(this.vehicleForm.year);
    const mileage = Number(this.vehicleForm.mileage);
    const seats = Number(this.vehicleForm.seats);
    const doors = Number(this.vehicleForm.doors);
    const pricePerDay = Number(this.vehicleForm.pricePerDay);

    if (isNaN(year) || year < 1900 || year > new Date().getFullYear() + 1) {
      console.log('Year validation failed:', this.vehicleForm.year, 'parsed as:', year);
      this.toastService.showError('Please enter a valid year.');
      return false;
    }

    if (isNaN(mileage) || mileage < 0) {
      console.log('Mileage validation failed:', this.vehicleForm.mileage, 'parsed as:', mileage);
      this.toastService.showError('Please enter a valid mileage.');
      return false;
    }

    if (isNaN(seats) || seats <= 0 || seats > 20) {
      console.log('Seats validation failed:', this.vehicleForm.seats, 'parsed as:', seats);
      this.toastService.showError('Please enter a valid number of seats (1-20).');
      return false;
    }

    if (isNaN(doors) || doors < 2 || doors > 6) {
      console.log('Doors validation failed:', this.vehicleForm.doors, 'parsed as:', doors);
      this.toastService.showError('Please enter a valid number of doors (2-6).');
      return false;
    }

    if (isNaN(pricePerDay) || pricePerDay <= 0) {
      console.log('Price per day validation failed:', this.vehicleForm.pricePerDay, 'parsed as:', pricePerDay);
      this.toastService.showError('Price per day must be greater than 0.');
      return false;
    }

    // Check optional price fields
    if (this.vehicleForm.pricePerWeek !== undefined && this.vehicleForm.pricePerWeek !== null) {
      const pricePerWeek = Number(this.vehicleForm.pricePerWeek);
      if (isNaN(pricePerWeek) || pricePerWeek <= 0) {
        console.log('Price per week validation failed:', this.vehicleForm.pricePerWeek, 'parsed as:', pricePerWeek);
        this.toastService.showError('Price per week must be greater than 0.');
        return false;
      }
    }

    if (this.vehicleForm.pricePerMonth !== undefined && this.vehicleForm.pricePerMonth !== null) {
      const pricePerMonth = Number(this.vehicleForm.pricePerMonth);
      if (isNaN(pricePerMonth) || pricePerMonth <= 0) {
        console.log('Price per month validation failed:', this.vehicleForm.pricePerMonth, 'parsed as:', pricePerMonth);
        this.toastService.showError('Price per month must be greater than 0.');
        return false;
      }
    }

    console.log('Form validation passed successfully');
    return true;
  }

  cancel() {
    this.router.navigate(['/vehicles']);
  }
}

