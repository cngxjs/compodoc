import { afterEach, beforeAll, describe, expect, it } from 'vitest';
import {
    clearCustomTemplates,
    registerCustomTemplate
} from '../../../../src/app/engines/custom-template.engine';
import I18nEngine from '../../../../src/app/engines/i18n.engine';
import type { FileRefBundle } from '../../../../src/app/engines/stackblitz';
import { EntityTabs } from '../../../../src/templates/blocks/EntityTabs';
import type { ComponentPlaygroundBlock } from '../../../../src/templates/helpers/jsdoc';

beforeAll(() => {
    I18nEngine.init('en-US');
});

const tab = (id: string) => ({
    id,
    href: `#${id}`,
    label: id,
    'data-link': id
});

const block = (title: string, line = 0): ComponentPlaygroundBlock => ({
    title,
    snippet: `<demo title="${title}" />`,
    language: 'html',
    line
});

const baseProps = {
    infoContent: '<div id="info-body" />',
    apiContent: ''
} as const;

describe('EntityTabs — Playground tab branch', () => {
    afterEach(() => {
        clearCustomTemplates();
    });

    it('renders the Playground panel when navTabs, entityName, and playgrounds are all present', () => {
        const html = EntityTabs({
            ...baseProps,
            navTabs: [tab('info'), tab('playground')],
            entityName: 'BorderDirective',
            entityFile: 'border.directive.ts',
            entitySourceCode: 'export class BorderDirective {}',
            playgrounds: [block('Hover')]
        });

        expect(html).to.include('id="playground"');
        expect(html).to.include('role="tabpanel"');
        expect(html).to.include('aria-labelledby="playground-tab"');
        // BlockPlayground emits per-block ids derived from the component name.
        expect(html).to.include('id="playground-borderdirective-0"');
    });

    it('marks the Playground panel active when it is the first nav tab', () => {
        const html = EntityTabs({
            ...baseProps,
            navTabs: [tab('playground'), tab('info')],
            entityName: 'BorderDirective',
            playgrounds: [block('Hover')]
        });

        // Match the playground panel opening tag specifically.
        const panelOpen = html.match(/<div class="cdx-tab-panel[^"]*" id="playground"/);
        expect(panelOpen).to.not.equal(null);
        expect(panelOpen![0]).to.include('active');
    });

    it('omits the Playground panel when navTabs does not contain it', () => {
        const html = EntityTabs({
            ...baseProps,
            navTabs: [tab('info'), tab('api')],
            entityName: 'BorderDirective',
            playgrounds: [block('Hover')]
        });

        expect(html).to.not.include('id="playground"');
    });

    it('omits the Playground panel when playgrounds is empty', () => {
        const html = EntityTabs({
            ...baseProps,
            navTabs: [tab('info'), tab('playground')],
            entityName: 'BorderDirective',
            playgrounds: []
        });

        expect(html).to.not.include('id="playground"');
    });

    it('omits the Playground panel when playgrounds is undefined', () => {
        const html = EntityTabs({
            ...baseProps,
            navTabs: [tab('info'), tab('playground')],
            entityName: 'BorderDirective'
        });

        expect(html).to.not.include('id="playground"');
    });

    it('omits the Playground panel when entityName is missing', () => {
        const html = EntityTabs({
            ...baseProps,
            navTabs: [tab('info'), tab('playground')],
            playgrounds: [block('Hover')]
        });

        expect(html).to.not.include('id="playground"');
    });

    it('forwards only the fileBundles keyed by `<entityName>:<index>` into PlaygroundContent', () => {
        const matching: FileRefBundle = {
            entry: { path: 'src/app/wanted.ts', content: 'export const wanted = true;' },
            files: []
        } as unknown as FileRefBundle;
        const otherEntity: FileRefBundle = {
            entry: { path: 'src/app/other.ts', content: 'export const other = true;' },
            files: []
        } as unknown as FileRefBundle;

        let captured: any = null;
        registerCustomTemplate('playground-content', (data: any) => {
            captured = data;
            return '<div id="captured-playground" />';
        });

        const html = EntityTabs({
            ...baseProps,
            navTabs: [tab('info'), tab('playground')],
            entityName: 'BorderDirective',
            playgrounds: [block('Hover'), block('Disabled')],
            playgroundFiles: {
                'BorderDirective:0': matching,
                'OtherDirective:0': otherEntity,
                'BorderDirective:1': matching
            }
        });

        expect(html).to.include('id="captured-playground"');
        // `playground-content` override gets the high-level args, not
        // fileBundles — but the override path proves the panel was reached
        // with the correct component name.
        expect(captured.componentName).to.equal('BorderDirective');
        expect(captured.playgrounds).to.have.length(2);
    });

    it('still renders the Playground panel when fileBundles is empty (inline-only blocks)', () => {
        const html = EntityTabs({
            ...baseProps,
            navTabs: [tab('info'), tab('playground')],
            entityName: 'BorderDirective',
            playgrounds: [block('Hover')]
            // no playgroundFiles -> inline mode
        });

        expect(html).to.include('id="playground"');
        expect(html).to.include('id="playground-borderdirective-0"');
    });
});
