import { describe, expect, it } from 'vitest';
import { buildEntityIndex } from '../../../src/utils/entity-index.util';

describe('buildEntityIndex — miscellaneous entries', () => {
    it('routes untagged misc entries to anchor on collection page', () => {
        const index = buildEntityIndex({
            miscellaneous: {
                functions: [{ name: 'helperFn' }],
                variables: [{ name: 'VERSION' }],
                typealiases: [{ name: 'Maybe' }],
                enumerations: [{ name: 'Theme' }]
            }
        });
        expect(index['helperFn'].href).to.equal('miscellaneous/functions.html#helperFn');
        expect(index['VERSION'].href).to.equal('miscellaneous/variables.html#VERSION');
        expect(index['Maybe'].href).to.equal('miscellaneous/typealiases.html#Maybe');
        expect(index['Theme'].href).to.equal('miscellaneous/enumerations.html#Theme');
    });

    it('routes @category-tagged misc entries to a dedicated detail page', () => {
        const index = buildEntityIndex({
            miscellaneous: {
                functions: [{ name: 'provideToaster', category: 'Toast' }],
                variables: [{ name: 'TOAST_TOKEN', category: 'Toast' }],
                typealiases: [{ name: 'ToastConfig', category: 'Toast' }],
                enumerations: [{ name: 'ToastPosition', category: 'Toast' }]
            }
        });
        expect(index['provideToaster'].href).to.equal(
            'miscellaneous/functions/provideToaster.html'
        );
        expect(index['TOAST_TOKEN'].href).to.equal('miscellaneous/variables/TOAST_TOKEN.html');
        expect(index['ToastConfig'].href).to.equal('miscellaneous/typealiases/ToastConfig.html');
        expect(index['ToastPosition'].href).to.equal(
            'miscellaneous/enumerations/ToastPosition.html'
        );
    });

    it('treats whitespace-only `category` as untagged', () => {
        const index = buildEntityIndex({
            miscellaneous: {
                functions: [{ name: 'whitespaceCat', category: '   ' }]
            }
        });
        expect(index['whitespaceCat'].href).to.equal('miscellaneous/functions.html#whitespaceCat');
    });

    it('keeps the kind discriminator on every misc entry', () => {
        const index = buildEntityIndex({
            miscellaneous: {
                functions: [{ name: 'fn', category: 'X' }],
                variables: [{ name: 'v' }],
                typealiases: [{ name: 't' }],
                enumerations: [{ name: 'e' }]
            }
        });
        expect(index['fn'].kind).to.equal('function');
        expect(index['v'].kind).to.equal('variable');
        expect(index['t'].kind).to.equal('typealias');
        expect(index['e'].kind).to.equal('enum');
    });
});
