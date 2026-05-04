import { afterEach, beforeAll, describe, expect, it } from 'vitest';
import {
    clearCustomTemplates,
    registerCustomTemplate
} from '../../../../src/app/engines/custom-template.engine';
import I18nEngine from '../../../../src/app/engines/i18n.engine';
import { BlockHostBindings } from '../../../../src/templates/blocks/BlockHostBindings';

beforeAll(() => {
    I18nEngine.init('en-US');
});

describe('BlockHostBindings', () => {
    afterEach(() => {
        clearCustomTemplates();
    });

    it('renders the default block-host-bindings table with one row per binding', () => {
        const html = BlockHostBindings({
            bindings: [{ name: 'class.active', defaultValue: 'isActive' }]
        });
        expect(html).to.include('data-compodoc="block-host-bindings"');
        expect(html).to.include('class.active');
        expect(html).to.include('isActive');
    });

    it('honours the `block-host-bindings` custom-template override', () => {
        registerCustomTemplate(
            'block-host-bindings',
            (data: any) => `<section id="custom-hb">${data.bindings?.length ?? 0}</section>`
        );
        const html = BlockHostBindings({
            bindings: [{ name: 'class.a', defaultValue: 'x' }, { name: 'class.b', defaultValue: 'y' }]
        });
        expect(html).to.equal('<section id="custom-hb">2</section>');
        expect(html).to.not.include('cdx-host-table');
    });
});
