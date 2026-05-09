import { afterEach, beforeAll, describe, expect, it } from 'vitest';
import {
    clearCustomTemplates,
    registerCustomTemplate
} from '../../../../src/app/engines/custom-template.engine';
import I18nEngine from '../../../../src/app/engines/i18n.engine';
import { PlaygroundContent } from '../../../../src/templates/blocks/PlaygroundContent';
import type { ComponentPlaygroundBlock } from '../../../../src/templates/helpers/jsdoc';

beforeAll(() => {
    I18nEngine.init('en-US');
});

const block = (title: string): ComponentPlaygroundBlock => ({
    title,
    snippet: `<demo title="${title}" />`,
    language: 'html',
    line: 0
});

describe('PlaygroundContent', () => {
    afterEach(() => {
        clearCustomTemplates();
    });

    it('renders nothing when the component declares no playgrounds', () => {
        expect(PlaygroundContent({ componentName: 'MyButton', playgrounds: [] })).to.equal('');
    });

    it('renders one BlockPlayground per declared block in order', () => {
        const html = PlaygroundContent({
            componentName: 'MyButton',
            playgrounds: [block('Alpha'), block('Beta')]
        });
        const alpha = html.indexOf('Alpha');
        const beta = html.indexOf('Beta');
        expect(alpha).to.be.greaterThan(-1);
        expect(beta).to.be.greaterThan(-1);
        expect(alpha).to.be.lessThan(beta);
        expect(html).to.include('class="cdx-playground-stack"');
        expect(html).to.include('id="playground-mybutton-0"');
        expect(html).to.include('id="playground-mybutton-1"');
    });

    it('lets a playground-content override replace the default render', () => {
        registerCustomTemplate('playground-content', () => '<div id="custom-pg-tab" />');
        const html = PlaygroundContent({
            componentName: 'MyButton',
            playgrounds: [block('Alpha')]
        });
        expect(html).to.equal('<div id="custom-pg-tab" />');
    });
});
