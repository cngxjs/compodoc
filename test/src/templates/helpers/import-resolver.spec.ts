import { afterEach, describe, expect, it } from 'vitest';
import Configuration from '../../../../src/app/configuration';
import { resolveImportPath } from '../../../../src/templates/helpers/import-resolver';

describe('resolveImportPath', () => {
    const savedPaths = Configuration.mainData.tsconfigPaths;
    const savedBaseUrl = Configuration.mainData.tsconfigBaseUrl;

    afterEach(() => {
        Configuration.mainData.tsconfigPaths = savedPaths;
        Configuration.mainData.tsconfigBaseUrl = savedBaseUrl;
    });

    function setup(paths: Record<string, string[]>, baseUrl = '.') {
        Configuration.mainData.tsconfigPaths = paths;
        Configuration.mainData.tsconfigBaseUrl = baseUrl;
    }

    it('resolves a component file to its path alias', () => {
        setup({
            '@cngx/common/card': ['src/common/card/public-api.ts']
        });
        expect(
            resolveImportPath('test/fixtures/cngx-library/src/common/card/src/card.component.ts')
        ).toBe('@cngx/common/card');
    });

    it('resolves a service file to its path alias', () => {
        setup({
            '@cngx/ui/feedback': ['src/ui/feedback/public-api.ts']
        });
        expect(
            resolveImportPath('test/fixtures/cngx-library/src/ui/feedback/toast/toast.service.ts')
        ).toBe('@cngx/ui/feedback');
    });

    it('prefers the most specific (longest) matching path alias', () => {
        setup({
            '@cngx/common': ['src/common/src/public-api.ts'],
            '@cngx/common/card': ['src/common/card/public-api.ts']
        });
        expect(resolveImportPath('project/src/common/card/src/card.component.ts')).toBe(
            '@cngx/common/card'
        );
    });

    it('returns empty string when no path aliases are configured', () => {
        setup({});
        expect(resolveImportPath('src/app/some.component.ts')).toBe('');
    });

    it('returns empty string when entity file is empty', () => {
        setup({ '@cngx/core': ['src/core/public-api.ts'] });
        expect(resolveImportPath('')).toBe('');
    });

    it('returns empty string when no alias matches the file', () => {
        setup({
            '@cngx/ui/feedback': ['src/ui/feedback/public-api.ts']
        });
        expect(resolveImportPath('src/other/unrelated/file.ts')).toBe('');
    });

    it('handles wildcard path aliases (strips trailing /*)', () => {
        setup({
            '@cngx/core/*': ['src/core/*']
        });
        expect(resolveImportPath('project/src/core/utils/helper.ts')).toBe('@cngx/core');
    });

    it('handles non-dot baseUrl by prepending it to the target path', () => {
        setup({ '@lib/shared': ['shared/public-api.ts'] }, 'packages');
        expect(resolveImportPath('project/packages/shared/some.service.ts')).toBe('@lib/shared');
    });

    it('normalizes backslash paths (Windows)', () => {
        setup({
            '@cngx/common/card': ['src\\common\\card\\public-api.ts']
        });
        expect(resolveImportPath('project\\src\\common\\card\\src\\card.component.ts')).toBe(
            '@cngx/common/card'
        );
    });

    it('does not match partial directory names', () => {
        setup({
            '@cngx/common/car': ['src/common/car/public-api.ts']
        });
        // 'card' should NOT match 'car'
        expect(resolveImportPath('project/src/common/card/src/card.ts')).toBe('');
    });
});
