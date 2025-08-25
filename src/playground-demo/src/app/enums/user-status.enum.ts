/**
 * Represents the various states a user account can be in.
 *
 * @example
 * ```typescript
 * const user: User = {
 *   status: UserStatus.ACTIVE,
 *   // ...other properties
 * };
 * ```
 */
export enum UserStatus {
  /**
   * User account is active and can access all features
   */
  ACTIVE = 'active',

  /**
   * User account is temporarily suspended
   */
  SUSPENDED = 'suspended',

  /**
   * User account is pending email verification
   */
  PENDING_VERIFICATION = 'pending_verification',

  /**
   * User account has been permanently deactivated
   */
  DEACTIVATED = 'deactivated',

  /**
   * User account is locked due to security reasons
   */
  LOCKED = 'locked'
}
