import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';

import { User } from './interfaces/user.interface';
import { UserStatus } from './enums/user-status.enum';
import { UserService } from './services/user.service';
import { UserProfileUpdateEvent, UserProfileConfig } from './components/user-profile.component';

/**
 * Root component of the application that serves as the main entry point.
 *
 * This component manages the overall application layout and coordinates
 * between different feature components. It demonstrates the integration
 * of various Angular constructs including services, components, and data flow.
 *
 * @example
 * The AppComponent is automatically bootstrapped by Angular:
 * ```typescript
 * // In app.module.ts
 * @NgModule({
 *   bootstrap: [AppComponent]
 * })
 * export class AppModule { }
 * ```
 */
@Component({
  selector: 'app-root',
  template: `
    <div class="app-container" [ngClass]="getAppContainerClasses()">
      <header class="app-header">
        <h1>{{ title }}</h1>
        <p>{{ getGreeting() }}</p>
        <div class="app-stats">
          <span>Version: {{ version }}</span> |
          <span>Users: {{ getAppStats().userCount }}</span>
        </div>
      </header>

      <main class="app-main">
        <div *ngIf="isLoading" class="loading">Loading application...</div>

        <div *ngIf="errorMessage" class="error-banner">
          {{ errorMessage }}
          <button (click)="clearError()">×</button>
        </div>

        <div class="user-section" *ngIf="!isLoading">
          <h2>User Management Demo</h2>
          <app-user-profile
            [user]="currentUser"
            [config]="profileConfig"
            [loading]="isLoading"
            [errorMessage]="errorMessage"
            (userUpdated)="onUserUpdated($event)"
            (statusChanged)="onStatusChanged($event)"
            (error)="onError($event)"
            (deleteRequested)="onDeleteRequested($event)">
          </app-user-profile>

          <div class="action-buttons">
            <button (click)="toggleProfileMode()">
              Toggle {{ profileConfig.readonly ? 'Edit' : 'Read-only' }} Mode
            </button>
            <button (click)="refreshUserData()">Refresh Data</button>
          </div>
        </div>
      </main>
    </div>
  `,
  styles: [`
    .app-container {
      min-height: 100vh;
      background: #f5f5f5;
      font-family: Arial, sans-serif;
    }
    .app-header {
      background: #007bff;
      color: white;
      padding: 20px;
      text-align: center;
    }
    .app-header h1 {
      margin: 0 0 10px 0;
    }
    .app-stats {
      margin-top: 10px;
      font-size: 0.9em;
      opacity: 0.9;
    }
    .app-main {
      padding: 20px;
      max-width: 1200px;
      margin: 0 auto;
    }
    .loading {
      text-align: center;
      padding: 40px;
      color: #007bff;
      font-size: 1.2em;
    }
    .error-banner {
      background: #f8d7da;
      color: #721c24;
      padding: 10px 15px;
      border-radius: 4px;
      margin-bottom: 20px;
      position: relative;
    }
    .error-banner button {
      position: absolute;
      right: 10px;
      top: 50%;
      transform: translateY(-50%);
      background: none;
      border: none;
      color: #721c24;
      font-size: 20px;
      cursor: pointer;
    }
    .user-section h2 {
      color: #333;
      margin-bottom: 20px;
    }
    .action-buttons {
      margin-top: 20px;
      display: flex;
      gap: 10px;
    }
    .action-buttons button {
      background: #28a745;
      color: white;
      border: none;
      padding: 10px 15px;
      border-radius: 4px;
      cursor: pointer;
    }
    .action-buttons button:hover {
      background: #218838;
    }
  `]
})
export class AppComponent implements OnInit, OnDestroy {

  /** Application title displayed in the header */
  title = 'Compodoc Fake Project';

  /** Version of the application */
  readonly version = '1.0.0';

  /** Current user loaded from the user service */
  currentUser: User | null = null;

  /** Whether the application is in loading state */
  isLoading: boolean = false;

  /** Current error message to display */
  errorMessage: string | null = null;

  /** Configuration for the user profile component */
  profileConfig: UserProfileConfig = {
    readonly: false,
    showAvatar: true,
    showAdvanced: true,
    customCssClasses: ['main-profile']
  };

  /** Subject for managing component destruction */
  private destroy$ = new Subject<void>();

  /** Mock user data for demonstration */
  private readonly mockUser: User = {
    id: 'user-123',
    email: 'john.doe@example.com',
    firstName: 'John',
    lastName: 'Doe',
    displayName: 'Johnny',
    avatarUrl: '/assets/images/default-avatar.png',
    phoneNumber: '+1-555-0123',
    status: UserStatus.ACTIVE,
    address: {
      street1: '123 Main Street',
      street2: 'Apt 4B',
      city: 'New York',
      state: 'NY',
      postalCode: '10001',
      country: 'US'
    },
    preferences: {
      language: 'en',
      timezone: 'America/New_York',
      emailNotifications: true,
      pushNotifications: false,
      theme: 'auto'
    },
    createdAt: new Date('2023-01-15T10:30:00Z'),
    updatedAt: new Date('2024-12-01T14:45:00Z'),
    lastLoginAt: new Date('2024-12-13T18:00:00Z'),
    roleIds: ['user', 'premium'],
    emailVerified: true,
    phoneVerified: false
  };

  /**
   * Creates an instance of AppComponent.
   *
   * @param userService - Service for managing user operations
   */
  constructor(private userService: UserService) {}

  /**
   * Component initialization lifecycle hook.
   * Sets up subscriptions and loads initial data.
   */
  ngOnInit(): void {
    this.setupUserSubscription();
    this.loadInitialData();

    console.log('🎉 AppComponent initialized', {
      title: this.title,
      version: this.version
    });
  }

  /**
   * Component destruction lifecycle hook.
   * Cleans up subscriptions and resources.
   */
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();

    console.log('AppComponent destroyed');
  }

  /**
   * Set up subscription to user service for real-time user updates
   *
   * @private
   */
  private setupUserSubscription(): void {
    this.userService.getCurrentUser()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (user) => {
          this.currentUser = user;
          console.log('Current user updated:', user?.id || 'none');
        },
        error: (error) => {
          console.error('Error getting current user:', error);
          this.errorMessage = 'Failed to load user information';
        }
      });
  }

  /**
   * Load initial application data
   *
   * @private
   */
  private loadInitialData(): void {
    this.isLoading = true;

    // Simulate loading the current user
    setTimeout(() => {
      this.userService.setCurrentUser(this.mockUser);
      this.isLoading = false;
    }, 1000);
  }

  /**
   * Handle user profile update events from child components
   *
   * @param event - The user profile update event
   *
   * @example
   * ```html
   * <app-user-profile (userUpdated)="onUserUpdated($event)"></app-user-profile>
   * ```
   */
  onUserUpdated(event: UserProfileUpdateEvent): void {
    console.log('User profile updated:', {
      userId: event.user.id,
      changedFields: event.changedFields,
      timestamp: event.timestamp
    });

    // Update local reference
    this.currentUser = event.user;

    // Show success message
    this.showSuccessMessage(`Profile updated successfully! Changed: ${event.changedFields.join(', ')}`);
  }

  /**
   * Handle user status change events
   *
   * @param event - The status change event
   *
   * @example
   * ```html
   * <app-user-profile (statusChanged)="onStatusChanged($event)"></app-user-profile>
   * ```
   */
  onStatusChanged(event: { user: User; oldStatus: UserStatus; newStatus: UserStatus }): void {
    console.log('User status changed:', {
      userId: event.user.id,
      oldStatus: event.oldStatus,
      newStatus: event.newStatus
    });

    this.showSuccessMessage(`Status changed from ${event.oldStatus} to ${event.newStatus}`);
  }

  /**
   * Handle error events from child components
   *
   * @param errorMessage - The error message to display
   *
   * @example
   * ```html
   * <app-user-profile (error)="onError($event)"></app-user-profile>
   * ```
   */
  onError(errorMessage: string): void {
    console.error('Child component error:', errorMessage);
    this.errorMessage = errorMessage;

    // Auto-clear error after 5 seconds
    setTimeout(() => {
      this.errorMessage = null;
    }, 5000);
  }

  /**
   * Handle user delete requests
   *
   * @param user - The user to delete
   *
   * @example
   * ```html
   * <app-user-profile (deleteRequested)="onDeleteRequested($event)"></app-user-profile>
   * ```
   */
  onDeleteRequested(user: User): void {
    console.log('Delete requested for user:', user.id);

    // In a real app, this would show a confirmation dialog
    // and call the delete service
    this.showSuccessMessage(`Delete request received for ${user.firstName} ${user.lastName}`);
  }

  /**
   * Toggle the profile configuration between readonly and editable
   *
   * @example
   * ```html
   * <button (click)="toggleProfileMode()">Toggle Edit Mode</button>
   * ```
   */
  toggleProfileMode(): void {
    this.profileConfig = {
      ...this.profileConfig,
      readonly: !this.profileConfig.readonly
    };

    console.log('Profile mode toggled:', this.profileConfig.readonly ? 'readonly' : 'editable');
  }

  /**
   * Refresh the current user data
   *
   * @example
   * ```html
   * <button (click)="refreshUserData()">Refresh</button>
   * ```
   */
  async refreshUserData(): Promise<void> {
    if (!this.currentUser) return;

    this.isLoading = true;

    try {
      // In a real app, this would call the API
      // For demo, we'll just simulate a refresh
      await new Promise(resolve => setTimeout(resolve, 1000));

      const refreshedUser = {
        ...this.currentUser,
        updatedAt: new Date(),
        lastLoginAt: new Date()
      };

      this.userService.setCurrentUser(refreshedUser);
      this.showSuccessMessage('User data refreshed successfully');

    } catch (error) {
      console.error('Error refreshing user data:', error);
      this.errorMessage = 'Failed to refresh user data';
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * Clear the current error message
   *
   * @example
   * ```html
   * <button (click)="clearError()">Clear Error</button>
   * ```
   */
  clearError(): void {
    this.errorMessage = null;
  }

  /**
   * Get the greeting message based on current time
   *
   * @returns Appropriate greeting message
   *
   * @example
   * ```html
   * <h1>{{ getGreeting() }}</h1>
   * ```
   */
  getGreeting(): string {
    const hour = new Date().getHours();

    if (hour < 12) {
      return 'Good Morning';
    } else if (hour < 17) {
      return 'Good Afternoon';
    } else {
      return 'Good Evening';
    }
  }

  /**
   * Get application statistics for display
   *
   * @returns Object containing app statistics
   */
  getAppStats(): { uptime: string; userCount: number; version: string } {
    // Calculate uptime (in a real app, this would be from server)
    const startTime = new Date('2024-01-01T00:00:00Z');
    const now = new Date();
    const uptimeDays = Math.floor((now.getTime() - startTime.getTime()) / (1000 * 60 * 60 * 24));

    return {
      uptime: `${uptimeDays} days`,
      userCount: 1250, // Mock data
      version: this.version
    };
  }

  /**
   * Check if the current user has a specific status
   *
   * @param status - The status to check
   * @returns True if user has the specified status
   */
  userHasStatus(status: UserStatus): boolean {
    return this.currentUser?.status === status;
  }

  /**
   * Show a success message (in a real app, this might use a toast service)
   *
   * @param message - The success message to display
   * @private
   */
  private showSuccessMessage(message: string): void {
    console.log('✅ Success:', message);

    // In a real app, you might use a toast notification service
    // For now, we'll just log and potentially show in UI
  }

  /**
   * Get CSS classes for the main application container
   *
   * @returns Object with CSS class names as keys and boolean values
   */
  getAppContainerClasses(): Record<string, boolean> {
    return {
      'app-container': true,
      'app-container--loading': this.isLoading,
      'app-container--has-error': !!this.errorMessage,
      'app-container--user-logged-in': !!this.currentUser,
      'app-container--readonly': this.profileConfig.readonly
    };
  }

  /**
   * Format a date for display in the UI
   *
   * @param date - The date to format
   * @returns Formatted date string
   */
  formatDate(date: Date | undefined): string {
    if (!date) return 'Never';

    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(date));
  }
}
