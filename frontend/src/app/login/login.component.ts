import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule
  ],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  credentials = {
    email: '',
    password: ''
  };
  
  hidePassword = true;
  isLoading = false;

  onSubmit() {
    if (this.credentials.email && this.credentials.password) {
      this.isLoading = true;
      // TODO: Implement actual login logic
      console.log('Login attempt:', this.credentials);
      
      // Simulate API call
      setTimeout(() => {
        this.isLoading = false;
        // Handle success/error here
      }, 2000);
    }
  }
}
