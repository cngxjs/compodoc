import {
  Component,
  OnInit,
  OnDestroy,
  Input,
  Output,
  EventEmitter,
  ViewChild,
  ElementRef,
  ChangeDetectionStrategy,
  ChangeDetectorRef
} from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';

import { User } from '../interfaces/user.interface';
import { UserStatus } from '../enums/user-status.enum';
import { UserService } from '../services/user.service';

/**
 * Event emitted when user profile is updated
 */
export interface UserProfileUpdateEvent {
  /** The updated user data */
  user: User;
  /** List of fields that were changed */
  changedFields: string[];
  /** Timestamp when the update occurred */
  timestamp: Date;
}

/**
 * Configuration options for the user profile component
 */
export interface UserProfileConfig {
  /** Whether the profile is in read-only mode */
  readonly?: boolean;
  /** Whether to show the user's avatar */
  showAvatar?: boolean;
  /** Whether to show advanced user information */
  showAdvanced?: boolean;
  /** Custom CSS classes to apply */
  customCssClasses?: string[];
}

/**
 * A comprehensive user profile component that displays and allows editing of user information.
 *
 * This component provides a full-featured user profile interface with form validation,
 * real-time updates, and comprehensive user management capabilities.
 *
 * @example
 * ```html
 * <app-user-profile
 *   [user]="currentUser"
 *   [config]="profileConfig"
 *   (userUpdated)="onUserUpdated($event)"
 *   (statusChanged)="onStatusChanged($event)">
 * </app-user-profile>
 * ```
 *
 * @example
 * ```typescript
 * // Component usage in parent
 * export class ParentComponent {
 *   currentUser: User = { ... };
 *   profileConfig: UserProfileConfig = {
 *     readonly: false,
 *     showAvatar: true,
 *     showAdvanced: true
 *   };
 *
 *   onUserUpdated(event: UserProfileUpdateEvent) {
 *     console.log('User updated:', event.user);
 *   }
 * }
 * ```
 */
@Component({
  selector: 'app-user-profile',
  template: `
    <div class="user-profile" [ngClass]="getContainerClasses()">
      <h2>User Profile</h2>
      <div *ngIf="loading" class="loading">Loading...</div>
      <div *ngIf="errorMessage" class="error">{{ errorMessage }}</div>
      <form [formGroup]="profileForm" *ngIf="user && !loading">
        <input formControlName="name" placeholder="Name" />
        <input formControlName="email" placeholder="Email" />
        <button type="button" (click)="saveProfile()" [disabled]="isSaving">
          {{ isSaving ? 'Saving...' : 'Save' }}
        </button>
      </form>
    </div>
  `,
  styles: [`
    .user-profile {
      padding: 20px;
      border: 1px solid #ddd;
      border-radius: 8px;
      max-width: 600px;
    }
    .loading { color: #007bff; }
    .error { color: #dc3545; }
    form input {
      display: block;
      width: 100%;
      margin: 10px 0;
      padding: 8px;
      border: 1px solid #ccc;
      border-radius: 4px;
    }
    button {
      background: #007bff;
      color: white;
      border: none;
      padding: 10px 20px;
      border-radius: 4px;
      cursor: pointer;
    }
    button:disabled {
      background: #ccc;
      cursor: not-allowed;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UserProfileComponent implements OnInit, OnDestroy {

  /**
   * The user data to display and edit
   *
   * @example
   * ```html
   * <app-user-profile [user]="selectedUser"></app-user-profile>
   * ```
   */
  @Input() user: User | null = null;

  /**
   * Configuration options for the component
   *
   * @default { readonly: false, showAvatar: true, showAdvanced: false }
   */
  @Input() config: UserProfileConfig = {
    readonly: false,
    showAvatar: true,
    showAdvanced: false
  };

  /**
   * Whether the component is in loading state
   *
   * @default false
   */
  @Input() loading: boolean = false;

  /**
   * Custom error message to display
   */
  @Input() errorMessage: string | null = null;

  /**
   * Event emitted when the user profile is successfully updated
   *
   * @example
   * ```html
   * <app-user-profile (userUpdated)="handleUserUpdate($event)"></app-user-profile>
   * ```
   */
  @Output() userUpdated = new EventEmitter<UserProfileUpdateEvent>();

  /**
   * Event emitted when the user's status changes
   *
   * @example
   * ```html
   * <app-user-profile (statusChanged)="handleStatusChange($event)"></app-user-profile>
   * ```
   */
  @Output() statusChanged = new EventEmitter<{ user: User; oldStatus: UserStatus; newStatus: UserStatus }>();

  /**
   * Event emitted when an error occurs during user operations
   */
  @Output() error = new EventEmitter<string>();

  /**
   * Event emitted when the user requests to delete their profile
   */
  @Output() deleteRequested = new EventEmitter<User>();

  /**
   * Reference to the avatar upload input element
   */
  @ViewChild('avatarInput', { static: false }) avatarInput!: ElementRef<HTMLInputElement>;

  /**
   * Reference to the main profile container
   */
  @ViewChild('profileContainer', { static: true }) profileContainer!: ElementRef<HTMLDivElement>;

  /** The reactive form for editing user profile */
  profileForm!: FormGroup;

  /** Whether the form is currently in edit mode */
  isEditMode: boolean = false;

  /** Whether a save operation is in progress */
  isSaving: boolean = false;

  /** List of available user statuses for status dropdown */
  readonly availableStatuses = Object.values(UserStatus);

  /** Original user data before editing (for cancel functionality) */
  private originalUserData: User | null = null;

  /** Subject for managing component destruction */
  private destroy$ = new Subject<void>();

  /**
   * Creates an instance of UserProfileComponent.
   *
   * @param userService - Service for user-related operations
   * @param formBuilder - Angular form builder for reactive forms
   * @param cdr - Change detector reference for manual change detection
   */
  constructor(
    private userService: UserService,
    private formBuilder: FormBuilder,
    private cdr: ChangeDetectorRef
  ) {
    this.initializeForm();
  }

  /**
   * Component initialization lifecycle hook.
   * Sets up the form and subscribes to user changes.
   */
  ngOnInit(): void {
    this.setupUserSubscription();
    this.setupFormValidation();

    if (this.user) {
      this.populateForm(this.user);
    }

    // Log component initialization for debugging
    console.log('UserProfileComponent initialized', {
      user: this.user?.id,
      config: this.config
    });
  }

  /**
   * Component destruction lifecycle hook.
   * Cleans up subscriptions and resources.
   */
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();

    console.log('UserProfileComponent destroyed');
  }

  /**
   * Initialize the reactive form with validation rules
   *
   * @private
   */
  private initializeForm(): void {
    this.profileForm = this.formBuilder.group({
      firstName: ['', [Validators.required, Validators.minLength(2)]],
      lastName: ['', [Validators.required, Validators.minLength(2)]],
      displayName: [''],
      email: ['', [Validators.required, Validators.email]],
      phoneNumber: ['', [Validators.pattern(/^\+?[\d\s-()]+$/)]],
      address: this.formBuilder.group({
        street1: [''],
        street2: [''],
        city: [''],
        state: [''],
        postalCode: [''],
        country: ['']
      }),
      preferences: this.formBuilder.group({
        language: ['en'],
        timezone: ['UTC'],
        emailNotifications: [true],
        pushNotifications: [true],
        theme: ['auto']
      })
    });

    // Disable form initially if in readonly mode
    if (this.config.readonly) {
      this.profileForm.disable();
    }
  }

  /**
   * Set up subscription to user service for real-time updates
   *
   * @private
   */
  private setupUserSubscription(): void {
    this.userService.getCurrentUser()
      .pipe(takeUntil(this.destroy$))
      .subscribe(user => {
        if (user && (!this.user || user.id === this.user.id)) {
          this.user = user;
          this.populateForm(user);
          this.cdr.markForCheck();
        }
      });
  }

  /**
   * Set up form validation and change detection
   *
   * @private
   */
  private setupFormValidation(): void {
    this.profileForm.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.cdr.markForCheck();
      });
  }

  /**
   * Populate the form with user data
   *
   * @param user - The user data to populate the form with
   * @private
   */
  private populateForm(user: User): void {
    if (!user) return;

    this.profileForm.patchValue({
      firstName: user.firstName,
      lastName: user.lastName,
      displayName: user.displayName || '',
      email: user.email,
      phoneNumber: user.phoneNumber || '',
      address: {
        street1: user.address?.street1 || '',
        street2: user.address?.street2 || '',
        city: user.address?.city || '',
        state: user.address?.state || '',
        postalCode: user.address?.postalCode || '',
        country: user.address?.country || ''
      },
      preferences: {
        language: user.preferences?.language || 'en',
        timezone: user.preferences?.timezone || 'UTC',
        emailNotifications: user.preferences?.emailNotifications ?? true,
        pushNotifications: user.preferences?.pushNotifications ?? true,
        theme: user.preferences?.theme || 'auto'
      }
    });
  }

  /**
   * Enter edit mode for the profile
   *
   * @example
   * ```html
   * <button (click)="enterEditMode()">Edit Profile</button>
   * ```
   */
  enterEditMode(): void {
    if (this.config.readonly) return;

    this.isEditMode = true;
    this.originalUserData = { ...this.user! };
    this.profileForm.enable();

    // Focus on first name field
    setTimeout(() => {
      const firstNameInput = this.profileContainer.nativeElement.querySelector('input[formControlName="firstName"]') as HTMLInputElement;
      firstNameInput?.focus();
    }, 100);

    console.log('Entered edit mode for user:', this.user?.id);
  }

  /**
   * Exit edit mode and revert changes
   *
   * @example
   * ```html
   * <button (click)="cancelEdit()">Cancel</button>
   * ```
   */
  cancelEdit(): void {
    this.isEditMode = false;

    if (this.originalUserData) {
      this.populateForm(this.originalUserData);
      this.originalUserData = null;
    }

    if (this.config.readonly) {
      this.profileForm.disable();
    }

    console.log('Cancelled edit mode');
  }

  /**
   * Save the current form data
   *
   * @returns Promise that resolves when save is complete
   *
   * @example
   * ```html
   * <button (click)="saveProfile()" [disabled]="!profileForm.valid">Save</button>
   * ```
   */
  async saveProfile(): Promise<void> {
    if (!this.profileForm.valid || !this.user || this.isSaving) {
      return;
    }

    this.isSaving = true;

    try {
      const formValue = this.profileForm.value;
      const updatedUserData: Partial<User> = {
        firstName: formValue.firstName,
        lastName: formValue.lastName,
        displayName: formValue.displayName || undefined,
        email: formValue.email,
        phoneNumber: formValue.phoneNumber || undefined,
        address: formValue.address,
        preferences: formValue.preferences,
        updatedAt: new Date()
      };

      const changedFields = this.getChangedFields(formValue);

      const updatedUser = await this.userService.updateUser(this.user.id, updatedUserData).toPromise();

      if (updatedUser) {
        this.user = updatedUser;
        this.isEditMode = false;
        this.originalUserData = null;

        // Emit update event
        this.userUpdated.emit({
          user: updatedUser,
          changedFields,
          timestamp: new Date()
        });

        console.log('Profile saved successfully', { userId: updatedUser.id, changedFields });
      }

    } catch (error) {
      console.error('Error saving profile:', error);
      this.error.emit('Failed to save profile. Please try again.');
    } finally {
      this.isSaving = false;
      this.cdr.markForCheck();
    }
  }

  /**
   * Change the user's status
   *
   * @param newStatus - The new status to set
   *
   * @example
   * ```html
   * <select (change)="changeStatus($event.target.value)">
   *   <option *ngFor="let status of availableStatuses" [value]="status">
   *     {{status}}
   *   </option>
   * </select>
   * ```
   */
  async changeStatus(newStatus: UserStatus): Promise<void> {
    if (!this.user || this.user.status === newStatus) return;

    const oldStatus = this.user.status;

    try {
      const updatedUser = await this.userService.changeUserStatus(this.user.id, newStatus).toPromise();

      if (updatedUser) {
        this.user = updatedUser;

        this.statusChanged.emit({
          user: updatedUser,
          oldStatus,
          newStatus
        });

        console.log('Status changed', { userId: updatedUser.id, oldStatus, newStatus });
      }

    } catch (error) {
      console.error('Error changing status:', error);
      this.error.emit('Failed to change user status. Please try again.');
    }
  }

  /**
   * Handle avatar file upload
   *
   * @param event - The file input change event
   *
   * @example
   * ```html
   * <input type="file" (change)="onAvatarUpload($event)" accept="image/*">
   * ```
   */
  onAvatarUpload(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (!file || !this.user) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      this.error.emit('Please select a valid image file.');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      this.error.emit('Image file must be smaller than 5MB.');
      return;
    }

    // Create preview URL
    const reader = new FileReader();
    reader.onload = (e) => {
      if (this.user && e.target?.result) {
        // In a real app, you would upload to a server
        // For now, just set the data URL as avatar
        this.user.avatarUrl = e.target.result as string;
        this.cdr.markForCheck();

        console.log('Avatar updated for user:', this.user.id);
      }
    };
    reader.readAsDataURL(file);
  }

  /**
   * Request user profile deletion
   *
   * @example
   * ```html
   * <button (click)="requestDelete()" class="danger">Delete Profile</button>
   * ```
   */
  requestDelete(): void {
    if (!this.user) return;

    // In a real app, you might show a confirmation dialog first
    const confirmed = confirm('Are you sure you want to delete this profile? This action cannot be undone.');

    if (confirmed) {
      this.deleteRequested.emit(this.user);
      console.log('Delete requested for user:', this.user.id);
    }
  }

  /**
   * Get the display name for the user
   *
   * @returns The user's display name or full name
   */
  getDisplayName(): string {
    if (!this.user) return '';

    return this.user.displayName ||
           `${this.user.firstName} ${this.user.lastName}`.trim() ||
           this.user.email;
  }

  /**
   * Get the initials for the user (for avatar placeholder)
   *
   * @returns Two-letter initials
   */
  getUserInitials(): string {
    if (!this.user) return '';

    const firstName = this.user.firstName?.[0] || '';
    const lastName = this.user.lastName?.[0] || '';

    return (firstName + lastName).toUpperCase() || this.user.email[0].toUpperCase();
  }

  /**
   * Check if a specific form field has errors
   *
   * @param fieldName - The name of the form field to check
   * @returns True if the field has errors
   */
  hasFieldError(fieldName: string): boolean {
    const field = this.profileForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  /**
   * Get error message for a specific form field
   *
   * @param fieldName - The name of the form field
   * @returns Error message or null
   */
  getFieldError(fieldName: string): string | null {
    const field = this.profileForm.get(fieldName);

    if (!field || !field.errors || !this.hasFieldError(fieldName)) {
      return null;
    }

    if (field.errors['required']) {
      return `${fieldName} is required`;
    }

    if (field.errors['email']) {
      return 'Please enter a valid email address';
    }

    if (field.errors['minlength']) {
      return `${fieldName} must be at least ${field.errors['minlength'].requiredLength} characters`;
    }

    if (field.errors['pattern']) {
      return `Please enter a valid ${fieldName}`;
    }

    return 'Invalid value';
  }

  /**
   * Check if the form has any unsaved changes
   *
   * @returns True if there are unsaved changes
   */
  hasUnsavedChanges(): boolean {
    if (!this.isEditMode || !this.originalUserData) return false;

    const currentFormValue = this.profileForm.value;
    return this.getChangedFields(currentFormValue).length > 0;
  }

  /**
   * Get list of fields that have changed from original values
   *
   * @param formValue - Current form values
   * @returns Array of changed field names
   * @private
   */
  private getChangedFields(formValue: any): string[] {
    if (!this.originalUserData) return [];

    const changedFields: string[] = [];

    // Check top-level fields
    ['firstName', 'lastName', 'displayName', 'email', 'phoneNumber'].forEach(field => {
      if (formValue[field] !== this.originalUserData![field as keyof User]) {
        changedFields.push(field);
      }
    });

    // Check nested address fields
    if (this.originalUserData.address) {
      Object.keys(formValue.address).forEach(field => {
        if (formValue.address[field] !== this.originalUserData!.address![field as keyof typeof this.originalUserData.address]) {
          changedFields.push(`address.${field}`);
        }
      });
    }

    // Check nested preference fields
    if (this.originalUserData.preferences) {
      Object.keys(formValue.preferences).forEach(field => {
        if (formValue.preferences[field] !== this.originalUserData!.preferences![field as keyof typeof this.originalUserData.preferences]) {
          changedFields.push(`preferences.${field}`);
        }
      });
    }

    return changedFields;
  }

  /**
   * Format a date for display
   *
   * @param date - The date to format
   * @returns Formatted date string
   */
  formatDate(date: Date | undefined): string {
    if (!date) return 'Never';

    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(date));
  }

  /**
   * Get CSS classes for the component container
   *
   * @returns Object with CSS class names as keys and boolean values
   */
  getContainerClasses(): Record<string, boolean> {
    return {
      'user-profile': true,
      'user-profile--readonly': this.config.readonly,
      'user-profile--edit-mode': this.isEditMode,
      'user-profile--loading': this.loading,
      'user-profile--with-avatar': this.config.showAvatar,
      'user-profile--advanced': this.config.showAdvanced,
      ...(this.config.customCssClasses?.reduce((acc, className) => {
        acc[className] = true;
        return acc;
      }, {} as Record<string, boolean>) || {})
    };
  }
}
