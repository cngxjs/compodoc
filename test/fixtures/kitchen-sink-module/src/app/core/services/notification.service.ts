import { Injectable } from '@angular/core';
import { Subject, Observable } from 'rxjs';

/**
 * Severity levels for notifications.
 */
export enum NotificationSeverity {
    Info = 'info',
    Success = 'success',
    Warning = 'warning',
    Error = 'error',
}

/**
 * A notification message to display to the user.
 */
export interface Notification {
    id: string;
    message: string;
    severity: NotificationSeverity;
    title?: string;
    duration?: number;
    dismissible?: boolean;
    action?: {
        label: string;
        callback: () => void;
    };
}

/**
 * Service for displaying in-app notifications.
 *
 * Emits notification events that can be consumed by a toast component.
 *
 * @example
 * ```typescript
 * notificationService.info('Item saved successfully');
 * notificationService.error('Failed to load data', { duration: 5000 });
 * ```
 */
@Injectable()
export class NotificationService {
    private notificationSubject = new Subject<Notification>();

    /** Observable stream of notifications. */
    readonly notifications$: Observable<Notification> = this.notificationSubject.asObservable();

    private counter = 0;

    /**
     * Show an informational notification.
     *
     * @param message - The message text
     * @param options - Optional configuration
     */
    info(message: string, options?: Partial<Notification>): void {
        this.show({ ...options, message, severity: NotificationSeverity.Info });
    }

    /**
     * Show a success notification.
     *
     * @param message - The message text
     * @param options - Optional configuration
     */
    success(message: string, options?: Partial<Notification>): void {
        this.show({ ...options, message, severity: NotificationSeverity.Success });
    }

    /**
     * Show a warning notification.
     *
     * @param message - The message text
     * @param options - Optional configuration
     */
    warn(message: string, options?: Partial<Notification>): void {
        this.show({ ...options, message, severity: NotificationSeverity.Warning });
    }

    /**
     * Show an error notification.
     *
     * @param message - The error message
     * @param options - Optional configuration
     */
    error(message: string, options?: Partial<Notification>): void {
        this.show({ ...options, message, severity: NotificationSeverity.Error });
    }

    /**
     * Emit a notification.
     * @internal
     */
    private show(partial: Partial<Notification> & { message: string; severity: NotificationSeverity }): void {
        const notification: Notification = {
            id: `notif-${++this.counter}`,
            dismissible: true,
            duration: 3000,
            ...partial,
        };
        this.notificationSubject.next(notification);
    }
}
