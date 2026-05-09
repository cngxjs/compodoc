import { afterEach, beforeAll, describe, expect, it } from 'vitest';
import {
    clearCustomTemplates,
    registerCustomTemplate
} from '../../../../src/app/engines/custom-template.engine';
import I18nEngine from '../../../../src/app/engines/i18n.engine';
import { BlockPlayground } from '../../../../src/templates/blocks/BlockPlayground';
import type { ComponentPlaygroundBlock } from '../../../../src/templates/helpers/jsdoc';

beforeAll(() => {
    I18nEngine.init('en-US');
});

const block: ComponentPlaygroundBlock = {
    title: 'Default state',
    snippet: '<my-button label="Click me" />',
    language: 'html',
    line: 0
};

describe('BlockPlayground', () => {
    afterEach(() => {
        clearCustomTemplates();
    });

    it('renders the manifest script and a launch button at the default render path', () => {
        const html = BlockPlayground({ componentName: 'MyButton', block, index: 0 });
        expect(html).to.include('data-compodoc="block-playground"');
        expect(html).to.include('id="playground-mybutton-0"');
        expect(html).to.include('Open in StackBlitz');
        expect(html).to.include('data-cdx-stackblitz-manifest="playground-mybutton-0"');
        expect(html).to.include('data-cdx-stackblitz-manifest-data="playground-mybutton-0"');
        expect(html).to.include('Default state');
    });

    it('honours the block-playground custom-template override', () => {
        registerCustomTemplate('block-playground', () => '<aside id="custom-pg" />');
        const html = BlockPlayground({ componentName: 'MyButton', block, index: 0 });
        expect(html).to.equal('<aside id="custom-pg" />');
    });
});
