import { Injectable } from '@angular/core';

/** User preference data. */
export interface UserPreferences {
    theme: 'light' | 'dark';
    language: string;
    notifications: boolean;
}

/**
 * Manages user settings and preferences.
 *
 * @since 1.1.0
 */
@Injectable({ providedIn: 'root' })
export class SettingsService {
    private prefs: UserPreferences = { theme: 'light', language: 'en', notifications: true };

    getPreferences(): UserPreferences {
        return { ...this.prefs };
    }

    updatePreferences(partial: Partial<UserPreferences>): void {
        this.prefs = { ...this.prefs, ...partial };
    }
}
