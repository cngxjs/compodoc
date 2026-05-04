import { afterEach, beforeAll, describe, expect, it } from 'vitest';
import {
    clearCustomTemplates,
    registerCustomTemplate
} from '../../../../src/app/engines/custom-template.engine';
import I18nEngine from '../../../../src/app/engines/i18n.engine';
import { BlockIndex } from '../../../../src/templates/blocks/BlockIndex';

beforeAll(() => {
    I18nEngine.init('en-US');
});

describe('BlockIndex', () => {
    afterEach(() => {
        clearCustomTemplates();
    });

    it('renders the default block-index section with grouped entries', () => {
        const html = BlockIndex({
            properties: [{ name: 'count' }],
            methods: [{ name: 'doThing' }]
        });
        expect(html).to.include('data-compodoc="block-index"');
        expect(html).to.include('count');
        expect(html).to.include('doThing');
    });

    it('honours the `block-index` custom-template override', () => {
        registerCustomTemplate(
            'block-index',
            (data: any) =>
                `<section id="custom-index">${(data.properties ?? []).length + (data.methods ?? []).length}</section>`
        );
        const html = BlockIndex({
            properties: [{ name: 'a' }, { name: 'b' }],
            methods: [{ name: 'x' }]
        });
        expect(html).to.equal('<section id="custom-index">3</section>');
        expect(html).to.not.include('cdx-index-entry');
    });
});
