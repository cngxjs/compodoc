import { afterEach, describe, expect, it } from 'vitest';
import Configuration from '../../../../src/app/configuration';
import { isToggled } from '../../../../src/templates/helpers/menu-helpers';

describe('isToggled', () => {
    const originalToggle = Configuration.mainData.toggleMenuItems;

    afterEach(() => {
        Configuration.mainData.toggleMenuItems = originalToggle;
    });

    it('returns false for every type when toggleMenuItems contains "all"', () => {
        Configuration.mainData.toggleMenuItems = ['all'];
        expect(isToggled('modules')).toBe(false);
        expect(isToggled('components')).toBe(false);
        expect(isToggled('directives')).toBe(false);
        expect(isToggled('additionalPages')).toBe(false);
    });

    it('returns true only for the types explicitly listed', () => {
        Configuration.mainData.toggleMenuItems = ['modules', 'components'];
        expect(isToggled('modules')).toBe(true);
        expect(isToggled('components')).toBe(true);
        expect(isToggled('directives')).toBe(false);
        expect(isToggled('classes')).toBe(false);
    });

    it('returns false for every type when the list is empty (default behaviour without overrides)', () => {
        Configuration.mainData.toggleMenuItems = [];
        expect(isToggled('modules')).toBe(false);
        expect(isToggled('components')).toBe(false);
    });

    it('treats "all" as overriding any other entries in the list', () => {
        Configuration.mainData.toggleMenuItems = ['modules', 'all', 'components'];
        // 'all' wins: nothing is open
        expect(isToggled('modules')).toBe(false);
        expect(isToggled('components')).toBe(false);
    });
});
