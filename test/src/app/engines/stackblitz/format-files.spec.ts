import {
    STACKBLITZ_FILE_CAP,
    STACKBLITZ_TRUNCATION_FOOTER
} from '../../../../../src/app/engines/stackblitz/constants';
import { emitFileContent } from '../../../../../src/app/engines/stackblitz/format-files';

describe('emitFileContent', () => {
    it('returns short content unchanged', () => {
        const text = 'export const x = 1;\n';
        expect(emitFileContent(text)).to.equal(text);
    });

    it('truncates long content at the cap and appends a footer', () => {
        const long = 'a'.repeat(STACKBLITZ_FILE_CAP + 100);
        const out = emitFileContent(long);
        expect(out.length).to.equal(STACKBLITZ_FILE_CAP + STACKBLITZ_TRUNCATION_FOOTER.length);
        expect(out.endsWith(STACKBLITZ_TRUNCATION_FOOTER)).to.be.true;
    });

    it('coerces non-string input via String(s ?? "") (F23)', () => {
        expect(emitFileContent(undefined)).to.equal('');
        expect(emitFileContent(null)).to.equal('');
        expect(emitFileContent(42 as unknown)).to.equal('42');
    });

    it('normalises Windows line endings to LF', () => {
        const mixed = 'line one\r\nline two\r\nline three';
        expect(emitFileContent(mixed)).to.equal('line one\nline two\nline three');
    });

    it('honours a custom cap (playgroundFileCap)', () => {
        const text = 'x'.repeat(100);
        const out = emitFileContent(text, 20);
        expect(out.length).to.equal(20 + STACKBLITZ_TRUNCATION_FOOTER.length);
        expect(out.startsWith('x'.repeat(20))).to.be.true;
    });

    it('falls back to the default cap for a non-positive or non-finite cap', () => {
        const long = 'a'.repeat(STACKBLITZ_FILE_CAP + 100);
        expect(emitFileContent(long, 0).length).to.equal(
            STACKBLITZ_FILE_CAP + STACKBLITZ_TRUNCATION_FOOTER.length
        );
        expect(emitFileContent(long, Number.NaN).length).to.equal(
            STACKBLITZ_FILE_CAP + STACKBLITZ_TRUNCATION_FOOTER.length
        );
    });
});
