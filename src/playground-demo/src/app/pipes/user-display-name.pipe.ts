import { Pipe, PipeTransform } from '@angular/core';
import { User } from '../interfaces/user.interface';

/**
 * Options for customizing the display name format
 */
export interface DisplayNameOptions {
  /** Whether to include the email as fallback */
  includeEmail?: boolean;
  /** Whether to show initials if no name is available */
  showInitials?: boolean;
  /** Maximum length of the display name */
  maxLength?: number;
  /** Whether to capitalize the name */
  capitalize?: boolean;
}

/**
 * Pipe for formatting user display names in a consistent way across the application.
 *
 * This pipe handles various user name scenarios and provides flexible formatting options
 * for displaying user names in different contexts.
 *
 * @example
 * Basic usage:
 * ```html
 * <p>Welcome, {{ user | userDisplayName }}!</p>
 * ```
 *
 * @example
 * With options:
 * ```html
 * <p>{{ user | userDisplayName: { maxLength: 20, includeEmail: true } }}</p>
 * ```
 *
 * @example
 * In TypeScript:
 * ```typescript
 * constructor(private userDisplayNamePipe: UserDisplayNamePipe) {}
 *
 * getFormattedName(user: User): string {
 *   return this.userDisplayNamePipe.transform(user, { capitalize: true });
 * }
 * ```
 */
@Pipe({
  name: 'userDisplayName',
  pure: true
})
export class UserDisplayNamePipe implements PipeTransform {

  /**
   * Transform a user object into a formatted display name.
   *
   * @param value - The user object to format
   * @param options - Optional formatting options
   * @returns Formatted display name string
   *
   * @example
   * ```typescript
   * // Returns "John Doe"
   * const name = pipe.transform({
   *   firstName: 'John',
   *   lastName: 'Doe',
   *   email: 'john@example.com'
   * });
   * ```
   *
   * @example
   * ```typescript
   * // Returns "john@example.com" (fallback to email)
   * const name = pipe.transform({
   *   firstName: '',
   *   lastName: '',
   *   email: 'john@example.com'
   * }, { includeEmail: true });
   * ```
   */
  transform(value: User | null | undefined, options?: DisplayNameOptions): string {
    if (!value) {
      return '';
    }

    const opts: DisplayNameOptions = {
      includeEmail: true,
      showInitials: false,
      maxLength: undefined,
      capitalize: false,
      ...options
    };

    let displayName = this.buildDisplayName(value, opts);

    if (opts.capitalize) {
      displayName = this.capitalizeWords(displayName);
    }

    if (opts.maxLength && displayName.length > opts.maxLength) {
      displayName = this.truncateString(displayName, opts.maxLength);
    }

    return displayName || 'Unknown User';
  }

  /**
   * Build the display name from user data based on available information
   *
   * @param user - The user object
   * @param options - Formatting options
   * @returns The constructed display name
   * @private
   */
  private buildDisplayName(user: User, options: DisplayNameOptions): string {
    // Priority 1: Use displayName if available
    if (user.displayName?.trim()) {
      return user.displayName.trim();
    }

    // Priority 2: Combine firstName and lastName
    const firstName = user.firstName?.trim() || '';
    const lastName = user.lastName?.trim() || '';

    if (firstName || lastName) {
      return `${firstName} ${lastName}`.trim();
    }

    // Priority 3: Use email if allowed
    if (options.includeEmail && user.email?.trim()) {
      return user.email.trim();
    }

    // Priority 4: Use initials if requested
    if (options.showInitials) {
      return this.getInitials(user);
    }

    return '';
  }

  /**
   * Get user initials from first and last name or email
   *
   * @param user - The user object
   * @returns User initials (up to 2 characters)
   * @private
   */
  private getInitials(user: User): string {
    const firstName = user.firstName?.trim() || '';
    const lastName = user.lastName?.trim() || '';

    if (firstName || lastName) {
      return `${firstName[0] || ''}${lastName[0] || ''}`.toUpperCase();
    }

    // Fallback to email initial
    if (user.email?.trim()) {
      return user.email[0].toUpperCase();
    }

    return 'U'; // Default to 'U' for Unknown
  }

  /**
   * Capitalize the first letter of each word
   *
   * @param text - The text to capitalize
   * @returns Capitalized text
   * @private
   */
  private capitalizeWords(text: string): string {
    return text.replace(/\b\w+/g, word =>
      word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    );
  }

  /**
   * Truncate string to specified length with ellipsis
   *
   * @param text - The text to truncate
   * @param maxLength - Maximum length including ellipsis
   * @returns Truncated text with ellipsis if needed
   * @private
   */
  private truncateString(text: string, maxLength: number): string {
    if (text.length <= maxLength) {
      return text;
    }

    const ellipsis = '...';
    const truncateLength = maxLength - ellipsis.length;

    if (truncateLength <= 0) {
      return ellipsis.slice(0, maxLength);
    }

    return text.slice(0, truncateLength) + ellipsis;
  }
}
