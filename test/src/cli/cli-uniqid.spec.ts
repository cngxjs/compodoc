import { temporaryDir } from '../helpers';

const tmp = temporaryDir();

describe('CLI Uniq id for file', () => {
    // TODO(cluster-2): the legacy js/menu-wc.js Web Component embedded a
    // file-path hash to namespace its element registration. The TSX menu has
    // no such artefact — there is nothing to assert a hash against. If we
    // still need a "stable id per file" guarantee, pick a different surface
    // (e.g. ids on rendered entity headings) and rewrite the assertion.
    it.skip('it should contain a uniqid', () => {
        expect(tmp.name).to.exist;
    });
});
