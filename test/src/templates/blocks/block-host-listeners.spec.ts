import { afterEach, beforeAll, describe, expect, it } from 'vitest';
import {
    clearCustomTemplates,
    registerCustomTemplate
} from '../../../../src/app/engines/custom-template.engine';
import I18nEngine from '../../../../src/app/engines/i18n.engine';
import { BlockHostListeners } from '../../../../src/templates/blocks/BlockHostListeners';

beforeAll(() => {
    I18nEngine.init('en-US');
});

describe('BlockHostListeners', () => {
    afterEach(() => {
        clearCustomTemplates();
    });

    it('renders the default block-host-listeners table with one row per listener', () => {
        const html = BlockHostListeners({
            listeners: [{ name: 'click', argsDecorator: ['$event'] }]
        });
        expect(html).to.include('data-compodoc="block-host-listeners"');
        expect(html).to.include('click($event)');
    });

    it('honours the `block-host-listeners` custom-template override (including for empty data)', () => {
        registerCustomTemplate(
            'block-host-listeners',
            (data: any) => `<section id="custom-hl">${data.listeners?.length ?? 0}</section>`
        );
        const html = BlockHostListeners({
            listeners: [{ name: 'click', argsDecorator: ['$event'] }, { name: 'blur' }]
        });
        expect(html).to.equal('<section id="custom-hl">2</section>');
        expect(html).to.not.include('cdx-host-table');
    });
});
