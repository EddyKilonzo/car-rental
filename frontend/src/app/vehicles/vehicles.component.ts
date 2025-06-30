import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute, NavigationEnd } from '@angular/router';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';
import { AuthService } from '../services/auth/auth.service';
import { VehicleService } from '../services/vehicle.service';
import { AgentService } from '../services/agent.service';
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

// Import VehicleResponse from service to avoid conflicts
interface VehicleResponse {
  success: boolean;
  data: Vehicle | Vehicle[];
  message?: string;
}

interface VehicleFilters {
  search: string;
  vehicleType: string;
  fuelType: string;
  minPrice: number | null;
  maxPrice: number | null;
}

interface VehicleEarnings {
  vehicleId: string;
  vehicleName: string;
  make: string;
  model: string;
  year: number;
  mainImageUrl?: string;
  totalEarnings: number;
  totalBookings: number;
  averageRating: number;
  totalReviews: number;
  lastBookingDate?: string;
}

@Component({
  selector: 'app-vehicles',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './vehicles.component.html',
  styleUrls: ['./vehicles.component.css']
})
export class VehiclesComponent implements OnInit, OnDestroy {
  private authService = inject(AuthService);
  private vehicleService = inject(VehicleService);
  private agentService = inject(AgentService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private toastService = inject(ToastService);

  vehicles: Vehicle[] = [];
  filteredVehicles: Vehicle[] = [];
  myVehicles: Vehicle[] = [];
  isLoading = false;
  currentUser: User | null = null;
  isAdmin = false;
  isAgent = false;
  isMyVehiclesRoute = false;
  
  // Earnings and Stats
  vehicleEarnings: VehicleEarnings[] = [];
  isLoadingEarnings = false;
  
  // Tab functionality
  activeTab: 'vehicles' | 'performance' = 'vehicles';
  
  // Overall agent performance stats
  agentStats: {
    totalEarnings: number;
    totalBookings: number;
    averageRating: number;
    totalReviews: number;
    monthlyEarnings: number;
    weeklyEarnings: number;
  } | null = null;

  filters: VehicleFilters = {
    search: '',
    vehicleType: '',
    fuelType: '',
    minPrice: null,
    maxPrice: null
  };

  private subscription?: Subscription;

  constructor() {}

  ngOnInit() {
    this.checkUserRole();
    this.checkRoute();
    this.loadVehicles();
    
    this.subscription = this.router.events.pipe(
      filter((event: any) => event instanceof NavigationEnd)
    ).subscribe(() => {
      this.loadVehicles();
    });
    
    // Earnings will be loaded after vehicles are loaded in loadAgentVehicles
    console.log('Vehicles component initialized - Route:', this.isMyVehiclesRoute, 'IsAgent:', this.isAgent);
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
        next: (vehicles: Vehicle[]) => {
          this.isLoading = false;
          
          if (this.currentUser?.role === 'AGENT') {
            // For agents, show only their vehicles
            this.vehicles = vehicles.filter(vehicle => vehicle.userId === this.currentUser?.id);
          } else {
            // For customers and admins, show all vehicles (backend already filters for active/available)
            this.vehicles = vehicles;
          }

          this.applyFilters();
        },
        error: (error) => {
          this.isLoading = false;
          console.error('Error loading vehicles:', error);
        }
      });
    }
  }

  loadAgentVehicles() {
    this.agentService.getAgentVehicles().subscribe({
      next: (response: any) => {
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
          
          // Load earnings data after vehicles are loaded
          if (this.isMyVehiclesRoute && this.isAgent) {
            console.log('Vehicles loaded, now loading earnings...');
            this.loadVehicleEarnings();
          }
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
      if (this.filters.vehicleType && vehicle.vehicleType !== this.filters.vehicleType) {
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
    return this.isAgent && vehicle.userId === this.currentUser?.id;
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

  deleteVehicle(vehicleId: string, vehicleName: string) {
    if (confirm(`Are you sure you want to delete "${vehicleName}"? This action cannot be undone.`)) {
      this.agentService.deleteVehicle(vehicleId).subscribe({
        next: (response) => {
          if (response.success) {
            this.toastService.showSuccess(`Vehicle "${vehicleName}" deleted successfully!`);
            this.loadVehicles(); // Reload the vehicles list
          } else {
            this.toastService.showError('Failed to delete vehicle.');
          }
        },
        error: (error) => {
          console.error('Error deleting vehicle:', error);
          this.toastService.showError('Failed to delete vehicle.');
        }
      });
    }
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

  isTopVehicle(vehicle: Vehicle): boolean {
    // Criteria for top vehicle:
    // 1. Has a main image (professional listing)
    // 2. Has features (well-equipped)
    // 3. Competitive pricing (not too expensive)
    // 4. Recent vehicle (year 2018 or newer)
    // 5. Popular vehicle types (SUV, Sedan)
    
    const hasImage = !!vehicle.mainImageUrl;
    const hasFeatures = vehicle.features && vehicle.features.length > 0;
    const isCompetitivePrice = vehicle.pricePerDay <= 5000; // KSH 5000 or less per day
    const isRecent = vehicle.year >= 2018;
    const isPopularType = ['SUV', 'SEDAN'].includes(vehicle.vehicleType);
    
    // Vehicle must meet at least 3 out of 5 criteria to be considered "top"
    const criteria = [hasImage, hasFeatures, isCompetitivePrice, isRecent, isPopularType];
    const metCriteria = criteria.filter(c => c).length;
    
    return metCriteria >= 3;
  }

  getVehicleBadge(vehicle: Vehicle): { text: string; class: string } | null {
    // Premium badge for luxury vehicles
    if (vehicle.pricePerDay > 8000) {
      return { text: 'Premium', class: 'premium' };
    }
    
    // Top vehicle badge
    if (this.isTopVehicle(vehicle)) {
      return { text: 'Top Vehicle', class: 'top' };
    }
    
    // New badge for recent vehicles (last 2 years)
    if (vehicle.year >= new Date().getFullYear() - 2) {
      return { text: 'New', class: 'new' };
    }
    
    // Budget badge for affordable vehicles
    if (vehicle.pricePerDay <= 2000) {
      return { text: 'Budget', class: 'budget' };
    }
    
    // Popular badge for popular vehicle types
    if (['SUV', 'SEDAN'].includes(vehicle.vehicleType)) {
      return { text: 'Popular', class: 'popular' };
    }
    
    return null;
  }

  loadVehicleEarnings() {
    console.log('loadVehicleEarnings called');
    this.isLoadingEarnings = true;
    
    // Load real booking and review data instead of fake earnings APIs
    Promise.all([
      this.agentService.getAgentBookings().toPromise(),
      this.agentService.getAgentReviews().toPromise()
    ]).then(([bookingsResponse, reviewsResponse]) => {
      console.log('Real bookings loaded:', bookingsResponse);
      console.log('Real reviews loaded:', reviewsResponse);
      
      const bookings = bookingsResponse || [];
      const reviews = reviewsResponse || [];
      
      // Calculate real earnings from completed bookings
      this.calculateRealEarningsFromBookings(bookings, reviews);
      
      this.isLoadingEarnings = false;
    }).catch((error) => {
      console.error('Error loading real booking data:', error);
      this.isLoadingEarnings = false;
      // If API fails, show empty stats
      this.agentStats = {
        totalEarnings: 0,
        totalBookings: 0,
        averageRating: 0,
        totalReviews: 0,
        monthlyEarnings: 0,
        weeklyEarnings: 0
      };
      this.vehicleEarnings = [];
    });
  }

  calculateRealEarningsFromBookings(bookings: any[], reviews: any[]) {
    console.log('Calculating real earnings from bookings...');
    
    // Calculate overall stats
    const completedBookings = bookings.filter(booking => booking.status === 'COMPLETED');
    const totalEarnings = completedBookings.reduce((sum, booking) => sum + booking.totalPrice, 0);
    const totalBookings = bookings.length;
    
    // Calculate average rating from reviews
    const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
    const averageRating = reviews.length > 0 ? totalRating / reviews.length : 0;
    
    // Calculate monthly and weekly earnings (last 30 and 7 days)
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    const monthlyBookings = completedBookings.filter(booking => 
      new Date(booking.updatedAt || booking.createdAt) >= thirtyDaysAgo
    );
    const weeklyBookings = completedBookings.filter(booking => 
      new Date(booking.updatedAt || booking.createdAt) >= sevenDaysAgo
    );
    
    const monthlyEarnings = monthlyBookings.reduce((sum, booking) => sum + booking.totalPrice, 0);
    const weeklyEarnings = weeklyBookings.reduce((sum, booking) => sum + booking.totalPrice, 0);
    
    // Set overall agent stats
    this.agentStats = {
      totalEarnings,
      totalBookings,
      averageRating,
      totalReviews: reviews.length,
      monthlyEarnings,
      weeklyEarnings
    };
    
    // Calculate per-vehicle earnings
    this.calculateVehicleEarnings(bookings, reviews);
    
    console.log('Real earnings calculated:', this.agentStats);
  }

  calculateVehicleEarnings(bookings: any[], reviews: any[]) {
    const vehicleEarningsMap = new Map<string, any>();
    
    // Initialize vehicle earnings for all vehicles
    this.vehicles.forEach(vehicle => {
      vehicleEarningsMap.set(vehicle.id, {
        vehicleId: vehicle.id,
        vehicleName: `${vehicle.make} ${vehicle.model}`,
        make: vehicle.make,
        model: vehicle.model,
        year: vehicle.year,
        mainImageUrl: vehicle.mainImageUrl,
        totalEarnings: 0,
        totalBookings: 0,
        averageRating: 0,
        totalReviews: 0,
        lastBookingDate: null
      });
    });
    
    // Calculate earnings from completed bookings
    const completedBookings = bookings.filter(booking => booking.status === 'COMPLETED');
    completedBookings.forEach(booking => {
      const vehicleId = booking.vehicle.id;
      const vehicleEarnings = vehicleEarningsMap.get(vehicleId);
      
      if (vehicleEarnings) {
        vehicleEarnings.totalEarnings += booking.totalPrice;
        vehicleEarnings.totalBookings += 1;
        
        const bookingDate = new Date(booking.updatedAt || booking.createdAt);
        if (!vehicleEarnings.lastBookingDate || bookingDate > new Date(vehicleEarnings.lastBookingDate)) {
          vehicleEarnings.lastBookingDate = bookingDate.toISOString();
        }
      }
    });
    
    // Calculate ratings from reviews
    reviews.forEach(review => {
      const vehicleId = review.booking.vehicle.id;
      const vehicleEarnings = vehicleEarningsMap.get(vehicleId);
      
      if (vehicleEarnings) {
        vehicleEarnings.totalReviews += 1;
        // Recalculate average rating
        const vehicleReviews = reviews.filter(r => r.booking.vehicle.id === vehicleId);
        const totalRating = vehicleReviews.reduce((sum, r) => sum + r.rating, 0);
        vehicleEarnings.averageRating = totalRating / vehicleReviews.length;
      }
    });
    
    this.vehicleEarnings = Array.from(vehicleEarningsMap.values());
    console.log('Vehicle earnings calculated:', this.vehicleEarnings);
  }

  getVehicleEarnings(vehicleId: string): VehicleEarnings | null {
    return this.vehicleEarnings.find(earning => earning.vehicleId === vehicleId) || null;
  }

  getAveragePricePerDay(): number {
    if (this.vehicles.length === 0) return 0;
    const totalPrice = this.vehicles.reduce((sum, vehicle) => sum + vehicle.pricePerDay, 0);
    return totalPrice / this.vehicles.length;
  }

  switchTab(tab: 'vehicles' | 'performance') {
    this.activeTab = tab;
    
    // Load earnings data when switching to performance tab
    if (tab === 'performance' && this.isAgent && this.isMyVehiclesRoute) {
      this.loadVehicleEarnings();
    }
  }
}
