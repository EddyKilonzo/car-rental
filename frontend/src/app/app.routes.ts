import { Routes } from '@angular/router';
import { LoginComponent } from './login/login.component';
import { LandingPageComponent } from './landing-page/landing-page.component';
import { ProfileComponent } from './profile/profile.component';
import { VehiclesComponent } from './vehicles/vehicles.component';
import { VehicleDetailsComponent } from './vehicle-details/vehicle-details.component';
import { VehicleFormComponent } from './vehicle-form/vehicle-form.component';
import { SignupComponent } from './signup/signup.component';
import { AdminDashboardComponent } from './admin/admin-dashboard/admin-dashboard.component';
import { AgentRequestsComponent } from './admin/agent-requests/agent-requests.component';
import { UsersManagementComponent } from './admin/users-management/users-management.component';

export const routes: Routes = [
  { path: '', component: LandingPageComponent },
  { path: 'login', component: LoginComponent },
  { path: 'signup', component: SignupComponent },
  { path: 'profile', component: ProfileComponent },
  { path: 'vehicles', component: VehiclesComponent },
  { path: 'my-vehicles', component: VehiclesComponent },
  { path: 'vehicle-details/:id', component: VehicleDetailsComponent },
  { path: 'vehicle-form', component: VehicleFormComponent },
  { path: 'vehicle-form/:id', component: VehicleFormComponent },
  { path: 'admin/agent-requests', component: AgentRequestsComponent },
  { path: 'admin/users', component: UsersManagementComponent },
  { path: 'admin/stats', component: AdminDashboardComponent },
];
