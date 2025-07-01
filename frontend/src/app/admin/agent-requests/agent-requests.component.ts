import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminService } from '../../services/admin.service';
import { ToastService } from '../../services/toast.service';

interface AgentApplication {
  id: string;
  userId: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    phone?: string | null;
  };
}

@Component({
  selector: 'app-agent-requests',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './agent-requests.component.html',
  styleUrls: ['./agent-requests.component.css']
})
export class AgentRequestsComponent implements OnInit {
  private adminService = inject(AdminService);
  private toastService = inject(ToastService);

  applications: AgentApplication[] = [];
  isLoading = false;
  processingUserId: string | null = null;
  error: string | null = null;

  constructor() {
    console.log('AgentRequestsComponent: Constructor called');
  }

  ngOnInit() {
    console.log('AgentRequestsComponent: ngOnInit called');
    this.loadAgentApplications();
  }

  loadAgentApplications() {
    this.isLoading = true;
    this.error = null;
    console.log('Loading agent applications...');
    this.adminService.getPendingAgentApplications().subscribe({
      next: (response) => {
        console.log('Agent applications response:', response);
        this.isLoading = false;
        if (response.success) {
          this.applications = response.data.applications || [];
          console.log('Applications loaded:', this.applications);
        } else {
          this.error = response.message || 'Failed to load agent applications';
          console.error('Error loading applications:', this.error);
        }
      },
      error: (error) => {
        console.error('Error in loadAgentApplications:', error);
        this.isLoading = false;
        this.error = error.error?.message || error.message || 'Failed to load agent applications';
        console.error('Error loading agent applications:', error);
      }
    });
  }
  /**
   * 
   * @param userId ID of the user whose application is being processed
   * Approves the agent application for the given user ID.
   */

  approveApplication(userId: string) {
    this.processingUserId = userId;
    this.adminService.approveAgent(userId).subscribe({
      next: () => {
        this.processingUserId = null;
        this.toastService.showSuccess('Agent application approved successfully!');
        this.loadAgentApplications(); // Reload the list
      },
      error: (error) => {
        this.processingUserId = null;
        this.toastService.showError('Failed to approve application.');
        console.error('Error approving application:', error);
      }
    });
  }
  /**
   * Rejects the agent application for the given user ID.
   * @param userId ID of the user whose application is being processed
   */
  rejectApplication(userId: string) {
    this.processingUserId = userId;
    this.adminService.rejectAgent(userId).subscribe({
      next: () => {
        this.processingUserId = null;
        this.toastService.showSuccess('Agent application rejected successfully!');
        this.loadAgentApplications(); // Reload the list
      },
      error: (error) => {
        this.processingUserId = null;
        this.toastService.showError('Failed to reject application.');
        console.error('Error rejecting application:', error);
      }
    });
  }
  /**
   * Formats a date string to a more readable format.
   * @param dateString The date string to format.
   * @returns Formatted date string.
   */
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