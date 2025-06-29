import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute, NavigationEnd } from '@angular/router';
import { AuthService } from '../services/auth/auth.service';
import { VehicleService } from '../services/vehicle.service';
import { AgentService } from '../services/agent.service';
import { ToastService } from '../services/toast.service';
import { filter, Subscription } from 'rxjs';

interface Vehicle {
  id: string;
  make: string;
  model: string;
  year: number;
  type: string;
  fuelType: string;
  seats: number;
  pricePerDay: number;
  mainImageUrl?: string;
  isAvailable: boolean;
  agentId?: string;
  description?: string;
  features?: string[];
}

interface VehicleFilters {
  search: string;
  vehicleType: string;
  fuelType: string;
  minPrice: number | null;
  maxPrice: number | null;
}

@Component({
  selector: 'app-vehicles',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './vehicles.component.html',
  styleUrls: ['./vehicles.component.css']
})
export class VehiclesComponent implements OnInit, OnDestroy {
  vehicles: Vehicle[] = [];
  filteredVehicles: Vehicle[] = [];
  myVehicles: Vehicle[] = [];
  isLoading = false;
  currentUser: any = null;
  isAdmin = false;
  isAgent = false;
  isMyVehiclesRoute = false;

  filters: VehicleFilters = {
    search: '',
    vehicleType: '',
    fuelType: '',
    minPrice: null,
    maxPrice: null
  };

  private subscription?: Subscription;

  constructor(
    private authService: AuthService,
    private vehicleService: VehicleService,
    private agentService: AgentService,
    private router: Router,
    private route: ActivatedRoute,
    private toastService: ToastService
  ) {}

  ngOnInit() {
    this.checkUserRole();
    this.checkRoute();
    this.loadVehicles();
    this.subscription = this.router.events.pipe(
      filter((event: any) => event instanceof NavigationEnd)
    ).subscribe(() => {
      this.loadVehicles();
    });
  }

  checkUserRole() {
    this.currentUser = this.authService.getCurrentUser();
    this.isAdmin = this.currentUser?.role === 'ADMIN';
    this.isAgent = this.currentUser?.role === 'AGENT';
  }

  checkRoute() {
    this.isMyVehiclesRoute = this.router.url.includes('/my-vehicles');
  }

  loadVehicles() {
    this.isLoading = true;

    if (this.isMyVehiclesRoute) {
      // Load only agent's vehicles for "My Vehicles" route
      this.loadAgentVehicles();
    } else {
      // Load all vehicles from the database for regular vehicles route
      this.vehicleService.getAllVehicles().subscribe({
        next: (response) => {
          // Backend returns vehicles array directly, not wrapped in data property
          const vehiclesData = Array.isArray(response) ? response : (response?.data || []);
          
          if (vehiclesData && vehiclesData.length > 0) {
            this.vehicles = vehiclesData.map((vehicle: any) => {
              return {
                id: vehicle.id,
                make: vehicle.make,
                model: vehicle.model,
                year: vehicle.year,
                type: vehicle.vehicleType,
                fuelType: vehicle.fuelType,
                seats: vehicle.seats,
                pricePerDay: vehicle.pricePerDay,
                mainImageUrl: vehicle.mainImageUrl,
                isAvailable: vehicle.status === 'AVAILABLE',
                agentId: vehicle.userId,
                description: vehicle.description,
                features: vehicle.features || []
              };
            });
            this.applyFilters();
          } else {
            this.vehicles = [];
            this.filteredVehicles = [];
          }
          
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error loading vehicles:', error);
          this.isLoading = false;
        }
      });
    }
  }

  loadAgentVehicles() {
    this.agentService.getAgentVehicles().subscribe({
      next: (response) => {
        // Backend returns vehicles array directly, not wrapped in data property
        const vehiclesData = Array.isArray(response) ? response : (response?.data || []);
        
        if (vehiclesData && vehiclesData.length > 0) {
          const agentVehicles = vehiclesData.map((vehicle: any) => ({
            id: vehicle.id,
            make: vehicle.make,
            model: vehicle.model,
            year: vehicle.year,
            type: vehicle.vehicleType,
            fuelType: vehicle.fuelType,
            seats: vehicle.seats,
            pricePerDay: vehicle.pricePerDay,
            mainImageUrl: vehicle.mainImageUrl,
            isAvailable: vehicle.status === 'AVAILABLE',
            agentId: vehicle.userId,
            description: vehicle.description,
            features: vehicle.features || []
          }));
          
          // For "My Vehicles" route, show only agent's vehicles
          this.vehicles = agentVehicles;
          this.filteredVehicles = agentVehicles;
        } else {
          this.vehicles = [];
          this.filteredVehicles = [];
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading agent vehicles:', error);
        this.isLoading = false;
      }
    });
  }

  applyFilters() {
    this.filteredVehicles = this.vehicles.filter(vehicle => {
      // Search filter
      if (this.filters.search) {
        const searchTerm = this.filters.search.toLowerCase();
        const vehicleText = `${vehicle.make} ${vehicle.model}`.toLowerCase();
        if (!vehicleText.includes(searchTerm)) {
          return false;
        }
      }

      // Vehicle type filter
      if (this.filters.vehicleType && vehicle.type !== this.filters.vehicleType) {
        return false;
      }

      // Fuel type filter
      if (this.filters.fuelType && vehicle.fuelType !== this.filters.fuelType) {
        return false;
      }

      // Price range filter
      if (this.filters.minPrice && vehicle.pricePerDay < this.filters.minPrice) {
        return false;
      }
      if (this.filters.maxPrice && vehicle.pricePerDay > this.filters.maxPrice) {
        return false;
      }

      return true;
    });
  }

  clearFilters() {
    this.filters = {
      search: '',
      vehicleType: '',
      fuelType: '',
      minPrice: null,
      maxPrice: null
    };
    this.applyFilters();
  }

  hasActiveFilters(): boolean {
    return !!(this.filters.search || 
              this.filters.vehicleType || 
              this.filters.fuelType || 
              this.filters.minPrice || 
              this.filters.maxPrice);
  }

  viewVehicleDetails(vehicleId: string) {
    this.router.navigate(['/vehicles', vehicleId]);
  }

  bookVehicle(vehicleId: string) {
    if (this.isAdmin) {
      this.toastService.showError('Admins cannot book vehicles. Please use a customer account.');
    } else if (this.isAgent) {
      this.toastService.showError('Agents cannot book vehicles. You can only post and manage vehicles.');
    } else if (!this.currentUser) {
      this.router.navigate(['/login']);
    } else {
      // Navigate to vehicle details to complete booking
      this.router.navigate(['/vehicle-details', vehicleId]);
    }
  }

  addNewVehicle() {
    if (this.isAgent) {
      this.router.navigate(['/vehicle-form']);
    }
  }

  canBookVehicle(): boolean {
    return !this.isAdmin && !this.isAgent && !!this.currentUser;
  }

  getBookingButtonText(): string {
    if (this.isAdmin) {
      return 'Admin Access';
    }
    if (this.isAgent) {
      return 'Agent Access';
    }
    if (!this.currentUser) {
      return 'Login to Book';
    }
    return 'Book Now';
  }

  getBookingButtonClass(): string {
    if (this.isAdmin || this.isAgent) {
      return 'book-btn disabled';
    }
    if (!this.currentUser) {
      return 'book-btn login-required';
    }
    return 'book-btn';
  }

  getPageTitle(): string {
    if (this.isMyVehiclesRoute) {
      return 'My Vehicles';
    }
    return 'Available Vehicles';
  }

  getPageSubtitle(): string {
    if (this.isMyVehiclesRoute) {
      return 'Manage your vehicle listings';
    }
    return 'Find your perfect ride for any occasion';
  }

  isMyVehicle(vehicle: Vehicle): boolean {
    return this.isAgent && vehicle.agentId === this.currentUser?.id;
  }

  onImageError(event: any): void {
    console.error('Vehicle image failed to load:', event.target?.src);
    console.error('Image error details:', event);
    
    if (event.target) {
      const originalSrc = event.target.src;
      console.log('Original image source:', originalSrc);
      
      if (originalSrc && originalSrc.includes('cloudinary')) {
        console.error('Cloudinary image failed to load. Possible issues:');
        console.error('- CORS policy');
        console.error('- Invalid URL format');
        console.error('- Network connectivity');
        console.error('- Cloudinary service issues');
      }
      
      // Use a more reliable placeholder
      event.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjBmMGYwIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxOCIgZmlsbD0iIzY2NjY2NiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPk5vIEltYWdlPC90ZXh0Pjwvc3ZnPg==';
    }
  }

  onImageLoad(imageUrl: string): void {
    console.log('Vehicle image loaded successfully:', imageUrl);
  }

  editVehicle(vehicleId: string) {
    this.router.navigate(['/vehicle-form', vehicleId]);
  }

  onBookNow(vehicle: Vehicle) {
    if (!this.currentUser) {
      this.router.navigate(['/login']);
      return;
    }

    if (this.isAdmin) {
      this.toastService.showError('Admins cannot book vehicles. Please use a customer account.');
      return;
    }

    if (this.isAgent) {
      this.toastService.showError('Agents cannot book vehicles. You can only post and manage vehicles.');
      return;
    }

    // Navigate to vehicle details for booking
    this.router.navigate(['/vehicle-details', vehicle.id]);
  }

  ngOnDestroy() {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  refreshVehicles() {
    this.loadVehicles();
  }
}
