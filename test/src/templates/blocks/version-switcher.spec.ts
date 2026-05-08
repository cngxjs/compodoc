import { afterEach, describe, expect, it } from 'vitest';
import {
    clearCustomTemplates,
    registerCustomTemplate
} from '../../../../src/app/engines/custom-template.engine';
import { VersionSwitcher } from '../../../../src/templates/blocks/VersionSwitcher';

describe('VersionSwitcher', () => {
    afterEach(() => {
        clearCustomTemplates();
    });

    it('renders the trigger button with the current label', () => {
        const html = VersionSwitcher({
            currentLabel: 'v0.3.0',
            depth: 0,
            maxVersionsShown: 10
        });
        expect(html).toContain('class="cdx-version-switcher"');
        expect(html).toContain('data-compodoc="version-switcher"');
        expect(html).toContain('cdx-version-switcher-trigger');
        expect(html).toContain('v0.3.0');
    });

    it('exposes the current label via data attribute for the client', () => {
        const html = VersionSwitcher({
            currentLabel: 'main',
            depth: 0,
            maxVersionsShown: 10
        });
        expect(html).toContain('data-cdx-current-label="main"');
    });

    it('depth 0 produces a manifest URL one parent up (out of the version folder)', () => {
        // The version-switcher widget always traverses one folder above the
        // version subfolder to reach versions.json — root pages need exactly
        // one parent step.
        const html = VersionSwitcher({
            currentLabel: 'v1.0.0',
            depth: 0,
            maxVersionsShown: 10
        });
        expect(html).toContain('data-cdx-manifest-url="../versions.json"');
    });

    it('depth 2 produces a manifest URL with three parent traversals', () => {
        const html = VersionSwitcher({
            currentLabel: 'v1.0.0',
            depth: 2,
            maxVersionsShown: 10
        });
        expect(html).toContain('data-cdx-manifest-url="../../../versions.json"');
    });

    it('encodes the dropdown cap on the root element', () => {
        const html = VersionSwitcher({
            currentLabel: 'v1.0.0',
            depth: 0,
            maxVersionsShown: 4
        });
        expect(html).toContain('data-cdx-max-shown="4"');
    });

    it('encodes cap=0 verbatim (treated as unlimited by client)', () => {
        const html = VersionSwitcher({
            currentLabel: 'v1.0.0',
            depth: 0,
            maxVersionsShown: 0
        });
        expect(html).toContain('data-cdx-max-shown="0"');
    });

    it('a registered version-switcher override wins over the default render', () => {
        registerCustomTemplate('version-switcher', () => '<custom-switcher>X</custom-switcher>');
        const html = VersionSwitcher({
            currentLabel: 'v1.0.0',
            depth: 0,
            maxVersionsShown: 10
        });
        expect(html).toBe('<custom-switcher>X</custom-switcher>');
    });

    it('the override receives the full props payload', () => {
        let captured: unknown;
        registerCustomTemplate('version-switcher', data => {
            captured = data;
            return '';
        });
        VersionSwitcher({
            currentLabel: 'v0.3.0',
            depth: 1,
            maxVersionsShown: 4
        });
        expect(captured).toEqual({
            currentLabel: 'v0.3.0',
            depth: 1,
            maxVersionsShown: 4
        });
    });
});
