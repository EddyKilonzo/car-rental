import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminService } from '../../services/admin.service';
import { ToastService } from '../../services/toast.service';

interface AgentApplication {
  id: string;
  name: string;
  email: string;
  phone: string;
  createdAt: string;
}

@Component({
  selector: 'app-agent-requests',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './agent-requests.component.html',
  styleUrls: ['./agent-requests.component.css']
})
export class AgentRequestsComponent implements OnInit {
  applications: AgentApplication[] = [];
  isLoading = false;
  processingUserId: string | null = null;

  constructor(
    private adminService: AdminService,
    private toastService: ToastService
  ) {}

  ngOnInit() {
    this.loadPendingApplications();
  }

  loadPendingApplications() {
    this.isLoading = true;
    this.adminService.getPendingAgentApplications().subscribe({
      next: (response) => {
        this.isLoading = false;
        this.applications = response || [];
        console.log('Loaded applications:', this.applications);
      },
      error: (error) => {
        this.isLoading = false;
        this.toastService.showError('Failed to load agent applications.');
        console.error('Error loading applications:', error);
      }
    });
  }

  approveApplication(userId: string) {
    this.processingUserId = userId;
    this.adminService.approveAgent(userId).subscribe({
      next: (response) => {
        this.processingUserId = null;
        this.toastService.showSuccess('Agent application approved successfully!');
        this.loadPendingApplications(); // Reload the list
      },
      error: (error) => {
        this.processingUserId = null;
        this.toastService.showError('Failed to approve application.');
        console.error('Error approving application:', error);
      }
    });
  }

  rejectApplication(userId: string) {
    this.processingUserId = userId;
    this.adminService.rejectAgent(userId).subscribe({
      next: (response) => {
        this.processingUserId = null;
        this.toastService.showSuccess('Agent application rejected successfully!');
        this.loadPendingApplications(); // Reload the list
      },
      error: (error) => {
        this.processingUserId = null;
        this.toastService.showError('Failed to reject application.');
        console.error('Error rejecting application:', error);
      }
    });
  }

  getFormattedDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
} 