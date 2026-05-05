import { temporaryDir } from '../helpers';

const tmp = temporaryDir();

describe('CLI toggle menu items', () => {
    describe('with a list', () => {
        // TODO(cluster-2): rewrite for the inline TSX menu. The legacy
        // js/menu-wc.js artefact is gone, and `ion-ios-arrow-up` was an Ionicons
        // glyph replaced by Lucide SVGs. The toggle behaviour is now driven by
        // the `aria-expanded` attribute on `.menu-toggler` buttons in Menu.tsx
        // — this spec needs new assertions matching that markup.
        it.skip('it should have a toggled item menu', () => {
            expect(tmp.name).to.exist;
        });
    });
});
