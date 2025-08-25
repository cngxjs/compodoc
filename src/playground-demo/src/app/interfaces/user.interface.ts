import { UserStatus } from '../enums/user-status.enum';

/**
 * Address information for a user
 */
export interface Address {
  /** Street address line 1 */
  street1: string;
  /** Street address line 2 (optional) */
  street2?: string;
  /** City name */
  city: string;
  /** State or province */
  state: string;
  /** Postal or ZIP code */
  postalCode: string;
  /** Country code (ISO 3166-1 alpha-2) */
  country: string;
}

/**
 * User preferences and settings
 */
export interface UserPreferences {
  /** Preferred language code (ISO 639-1) */
  language: string;
  /** Preferred timezone */
  timezone: string;
  /** Email notification preferences */
  emailNotifications: boolean;
  /** Push notification preferences */
  pushNotifications: boolean;
  /** Theme preference */
  theme: 'light' | 'dark' | 'auto';
}

/**
 * Complete user profile information
 *
 * @example
 * ```typescript
 * const user: User = {
 *   id: '123',
 *   email: 'john@example.com',
 *   firstName: 'John',
 *   lastName: 'Doe',
 *   status: UserStatus.ACTIVE,
 *   createdAt: new Date(),
 *   updatedAt: new Date()
 * };
 * ```
 */
export interface User {
  /** Unique identifier for the user */
  id: string;

  /** User's email address (must be unique) */
  email: string;

  /** User's first name */
  firstName: string;

  /** User's last name */
  lastName: string;

  /** User's display name (optional) */
  displayName?: string;

  /** URL to user's profile picture */
  avatarUrl?: string;

  /** User's phone number */
  phoneNumber?: string;

  /** User's current status */
  status: UserStatus;

  /** User's address information */
  address?: Address;

  /** User's preferences and settings */
  preferences?: UserPreferences;

  /** Date when the user account was created */
  createdAt: Date;

  /** Date when the user account was last updated */
  updatedAt: Date;

  /** Date when the user last logged in */
  lastLoginAt?: Date;

  /** List of role IDs assigned to the user */
  roleIds: string[];

  /** Whether the user's email is verified */
  emailVerified: boolean;

  /** Whether the user's phone number is verified */
  phoneVerified: boolean;
}
