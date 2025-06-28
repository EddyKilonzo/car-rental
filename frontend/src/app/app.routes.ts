import { Routes } from '@angular/router';
import { LoginComponent } from './login/login.component';
import { LandingPageComponent } from './landing-page/landing-page.component';
import { ProfileComponent } from './profile/profile.component';
import { VehiclesComponent } from './vehicles/vehicles.component';
import { VehicleDetailsComponent } from './vehicle-details/vehicle-details.component';
import { VehicleFormComponent } from './vehicle-form/vehicle-form.component';
import { SignupComponent } from './signup/signup.component';

export const routes: Routes = [
  { path: '', component: LandingPageComponent },
  { path: 'login', component: LoginComponent },
  { path: 'signup', component: SignupComponent },
  { path: 'profile', component: ProfileComponent },
  { path: 'vehicles', component: VehiclesComponent },
  { path: 'vehicle-details/:id', component: VehicleDetailsComponent },
  { path: 'vehicle-form', component: VehicleFormComponent },
];
