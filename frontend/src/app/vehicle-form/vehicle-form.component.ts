import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../services/auth/auth.service';
import { UploadService } from '../services/upload.service';
import { VehicleService } from '../services/vehicle.service';
import { ToastService } from '../services/toast.service';

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

  isAgent = false;
  isLoading = false;
  selectedFile: File | null = null;
  previewUrl: string | null = null;
  isEditMode = false;
  vehicleId: string | null = null;
  currentImageUrl: string | null = null;
  newFeature: string = '';

  vehicleTypes = ['SEDAN', 'SUV', 'HATCHBACK', 'COUPE', 'CONVERTIBLE', 'VAN', 'TRUCK', 'LUXURY'];
  fuelTypes = ['PETROL', 'DIESEL', 'ELECTRIC', 'HYBRID', 'LPG'];
  transmissionTypes = ['MANUAL', 'AUTOMATIC'];

  constructor(
    private authService: AuthService,
    private uploadService: UploadService,
    private vehicleService: VehicleService,
    private toastService: ToastService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

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

  loadVehicleData(id: string) {
    this.isLoading = true;
    this.vehicleService.getVehicleById(id).subscribe({
      next: (vehicle: any) => {
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
          description: vehicle.description,
          features: vehicle.features || []
        };
        this.currentImageUrl = vehicle.mainImageUrl || null;
        this.previewUrl = this.currentImageUrl;
        this.isLoading = false;
      },
      error: (err) => {
        this.toastService.showError('Failed to load vehicle data.');
        this.isLoading = false;
      }
    });
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;
      this.createPreview(file);
    }
  }

  createPreview(file: File) {
    const reader = new FileReader();
    reader.onload = (e: any) => {
      this.previewUrl = e.target.result;
    };
    reader.readAsDataURL(file);
  }

  addFeature() {
    if (this.newFeature && this.newFeature.trim()) {
      this.vehicleForm.features.push(this.newFeature.trim());
      this.newFeature = ''; // Clear the input after adding
    }
  }

  removeFeature(index: number) {
    this.vehicleForm.features.splice(index, 1);
  }

  async onSubmit() {
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
          const uploadResult = await this.uploadService.uploadVehicleMainImage(this.selectedFile).toPromise();
          console.log('Raw upload result:', uploadResult);
          console.log('Upload result type:', typeof uploadResult);
          console.log('Upload result keys:', Object.keys(uploadResult));
          
          imageUrl = uploadResult.secure_url || '';
          console.log('Extracted image URL:', imageUrl);
          console.log('Image upload successful:', uploadResult);
        } catch (uploadError) {
          console.error('Image upload failed:', uploadError);
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
        mainImageUrl: imageUrl || null
      };

      console.log('Sending vehicle data:', vehicleData);
      console.log('mainImageUrl value:', vehicleData.mainImageUrl);
      console.log('mainImageUrl type:', typeof vehicleData.mainImageUrl);

      if (this.isEditMode && this.vehicleId) {
        const result = await this.vehicleService.updateVehicle(this.vehicleId, vehicleData).toPromise();
        console.log('Vehicle update successful:', result);
        this.toastService.showSuccess('Vehicle updated successfully!');
      } else {
        const result = await this.vehicleService.createVehicle(vehicleData).toPromise();
        console.log('Vehicle creation successful:', result);
        this.toastService.showSuccess('Vehicle added successfully!');
      }
      this.router.navigate(['/vehicles']);
      
    } catch (error) {
      console.error('Error adding vehicle:', error);
      
      // Type guard to check if error is an object with properties
      if (error && typeof error === 'object') {
        console.error('Error details:', (error as any).error);
        console.error('Error message:', (error as any).message);
        console.error('Error status:', (error as any).status);
        
        // Show more specific error message if available
        let errorMessage = 'Failed to save vehicle. Please try again.';
        if ((error as any).error && (error as any).error.message) {
          errorMessage = (error as any).error.message;
        } else if ((error as any).message) {
          errorMessage = (error as any).message;
        }
        
        this.toastService.showError(errorMessage);
      } else {
        this.toastService.showError('Failed to save vehicle. Please try again.');
      }
    } finally {
      this.isLoading = false;
    }
  }

  validateForm(): boolean {
    if (!this.vehicleForm.make || !this.vehicleForm.model || !this.vehicleForm.licensePlate || 
        !this.vehicleForm.vin || !this.vehicleForm.vehicleType || !this.vehicleForm.fuelType || 
        !this.vehicleForm.transmission || !this.vehicleForm.color) {
      this.toastService.showError('Please fill in all required fields.');
      return false;
    }

    // Validate numeric fields
    const year = Number(this.vehicleForm.year);
    const mileage = Number(this.vehicleForm.mileage);
    const seats = Number(this.vehicleForm.seats);
    const doors = Number(this.vehicleForm.doors);
    const pricePerDay = Number(this.vehicleForm.pricePerDay);

    if (isNaN(year) || year < 1900 || year > new Date().getFullYear() + 1) {
      this.toastService.showError('Please enter a valid year.');
      return false;
    }

    if (isNaN(mileage) || mileage < 0) {
      this.toastService.showError('Please enter a valid mileage.');
      return false;
    }

    if (isNaN(seats) || seats <= 0 || seats > 20) {
      this.toastService.showError('Please enter a valid number of seats (1-20).');
      return false;
    }

    if (isNaN(doors) || doors < 2 || doors > 6) {
      this.toastService.showError('Please enter a valid number of doors (2-6).');
      return false;
    }

    if (isNaN(pricePerDay) || pricePerDay <= 0) {
      this.toastService.showError('Price per day must be greater than 0.');
      return false;
    }

    // Validate optional price fields
    if (this.vehicleForm.pricePerWeek !== undefined && this.vehicleForm.pricePerWeek !== null) {
      const pricePerWeek = Number(this.vehicleForm.pricePerWeek);
      if (isNaN(pricePerWeek) || pricePerWeek <= 0) {
        this.toastService.showError('Price per week must be greater than 0.');
        return false;
      }
    }

    if (this.vehicleForm.pricePerMonth !== undefined && this.vehicleForm.pricePerMonth !== null) {
      const pricePerMonth = Number(this.vehicleForm.pricePerMonth);
      if (isNaN(pricePerMonth) || pricePerMonth <= 0) {
        this.toastService.showError('Price per month must be greater than 0.');
        return false;
      }
    }

    return true;
  }

  cancel() {
    this.router.navigate(['/vehicles']);
  }
}

