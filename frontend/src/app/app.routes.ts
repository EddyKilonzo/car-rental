import { Routes } from '@angular/router';
import { LoginComponent } from './login/login.component';
import { LandingPageComponent } from './landing-page/landing-page.component';
import { ProfileComponent } from './profile/profile.component';
import { VehiclesComponent } from './vehicles/vehicles.component';
import { VehicleDetailsComponent } from './vehicle-details/vehicle-details.component';
import { VehicleFormComponent } from './vehicle-form/vehicle-form.component';
import { SignupComponent } from './signup/signup.component';
import { ForgotPasswordComponent } from './forgot-password/forgot-password.component';
import { AdminDashboardComponent } from './admin/admin-dashboard/admin-dashboard.component';
import { AgentRequestsComponent } from './admin/agent-requests/agent-requests.component';
import { UsersManagementComponent } from './admin/users-management/users-management.component';
import { ReviewsManagementComponent } from './admin/reviews-management/reviews-management.component';
import { BookingComponent } from './booking/booking.component';
import { BookingsComponent } from './bookings/bookings.component';
import { MyBookingsComponent } from './my-bookings/my-bookings.component';
import { AuthGuard } from './services/auth/auth.guard';
import { RoleGuard } from './services/auth/role.guard';
import { AgentDashboardComponent } from './agent/agent-dashboard/agent-dashboard';
import { NotFoundComponent } from './not-found/not-found.component';

export const routes: Routes = [
  { path: '', component: LandingPageComponent },
  { path: 'login', component: LoginComponent },
  { path: 'signup', component: SignupComponent },
  { path: 'forgot-password', component: ForgotPasswordComponent },
  { path: 'unauthorized', component: NotFoundComponent },
  { path: 'profile', component: ProfileComponent, canActivate: [AuthGuard] },
  { path: 'vehicles', component: VehiclesComponent },
  { path: 'vehicles/:id', component: VehicleDetailsComponent },
  { path: 'my-vehicles', component: VehiclesComponent, canActivate: [AuthGuard, RoleGuard], data: { roles: ['AGENT'] } },
  { path: 'booking/:vehicleId', component: BookingComponent, canActivate: [AuthGuard] },
  { path: 'bookings', component: BookingsComponent, canActivate: [AuthGuard] },
  { path: 'my-bookings', component: MyBookingsComponent, canActivate: [AuthGuard] },
  { path: 'vehicle-form', component: VehicleFormComponent, canActivate: [AuthGuard, RoleGuard], data: { roles: ['AGENT'] } },
  { path: 'vehicle-form/:id', component: VehicleFormComponent, canActivate: [AuthGuard, RoleGuard], data: { roles: ['AGENT'] } },
  { path: 'admin', component: AdminDashboardComponent, canActivate: [AuthGuard, RoleGuard], data: { roles: ['ADMIN'] } },
  { path: 'admin/users', component: UsersManagementComponent, canActivate: [AuthGuard, RoleGuard], data: { roles: ['ADMIN'] } },
  { path: 'admin/agent-requests', component: AgentRequestsComponent, canActivate: [AuthGuard, RoleGuard], data: { roles: ['ADMIN'] } },
  { path: 'admin/reviews', component: ReviewsManagementComponent, canActivate: [AuthGuard, RoleGuard], data: { roles: ['ADMIN'] } },
  { path: 'agent/dashboard', component: AgentDashboardComponent, canActivate: [AuthGuard, RoleGuard], data: { roles: ['AGENT'] } },
  { path: '**', component: NotFoundComponent }
];
