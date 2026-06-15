import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import Configuration from '../../../../src/app/configuration';
import type { PackageReader } from '../../../../src/app/engines/stackblitz';
import { PlaygroundValidator } from '../../../../src/app/page-generator/playground-validator';

// Pinned @cngx/ui@1.0.0 exports only `.` and only declares CngxButton — so a
// `@cngx/ui/tabs` subpath OR a `CngxTabNav` symbol is "from the future".
const pinnedReader: PackageReader = {
    hasPackage: (root: string): boolean => root === '@cngx/ui',
    readPackageJson: (root: string) =>
        root === '@cngx/ui'
            ? ({ version: '1.0.0', exports: { '.': { types: './index.d.ts' } } } as never)
            : null,
    readPackageFile: (root: string, rel: string): string | null =>
        root === '@cngx/ui' && rel === 'index.d.ts' ? 'export declare class CngxButton {}' : null
};

const resetMainData = (): void => {
    Configuration.mainData.components = [];
    Configuration.mainData.directives = [];
    Configuration.mainData.injectables = [];
    Configuration.mainData.guards = [];
    Configuration.mainData.interceptors = [];
    Configuration.mainData.pipes = [];
    Configuration.mainData.classes = [];
    Configuration.mainData.interfaces = [];
    Configuration.mainData.entities = [];
    Configuration.mainData.playgroundFiles = {};
    Configuration.mainData.playgroundVendorPackages = {};
    Configuration.mainData.strictPlaygrounds = false;
};

describe('PlaygroundValidator', () => {
    let warn: ReturnType<typeof vi.spyOn>;

    beforeEach(async () => {
        resetMainData();
        const { logger } = await import('../../../../src/utils/logger');
        warn = vi.spyOn(logger, 'warn').mockImplementation(() => undefined);
    });

    afterEach(() => {
        warn.mockRestore();
        resetMainData();
    });

    it('warns when a non-vendored playground imports a symbol absent from the pinned version', () => {
        Configuration.mainData.components = [
            {
                name: 'ButtonDemo',
                sourceCode: "import { CngxTabNav } from '@cngx/ui';\nexport class ButtonDemo {}",
                playgrounds: [{ title: 'Future symbol', snippet: '<x />', language: 'html' }]
            }
        ] as never;

        new PlaygroundValidator().resolve(pinnedReader);

        expect(warn).toHaveBeenCalledTimes(1);
        expect(warn.mock.calls[0][0]).toContain('CngxTabNav');
        expect(warn.mock.calls[0][0]).toContain('ButtonDemo');
    });

    it('throws under strictPlaygrounds when an issue is found', () => {
        Configuration.mainData.strictPlaygrounds = true;
        Configuration.mainData.components = [
            {
                name: 'TabsDemo',
                sourceCode: "import { Tabs } from '@cngx/ui/tabs';\nexport class TabsDemo {}",
                playgrounds: [{ title: 'Future subpath', snippet: '<x />', language: 'html' }]
            }
        ] as never;

        expect(() => new PlaygroundValidator().resolve(pinnedReader)).to.throw(/strictPlaygrounds/);
    });

    it('exempts a package that is vendored (ships the local build, not the registry)', () => {
        Configuration.mainData.playgroundVendorPackages = {
            '@cngx/ui': { name: '@cngx/ui', files: {}, vendorDeps: [], byteSize: 0 }
        } as never;
        Configuration.mainData.components = [
            {
                name: 'TabsDemo',
                sourceCode: "import { CngxTabNav } from '@cngx/ui/tabs';\nexport class TabsDemo {}",
                playgrounds: [{ title: 'Vendored', snippet: '<x />', language: 'html' }]
            }
        ] as never;

        new PlaygroundValidator().resolve(pinnedReader);
        expect(warn).not.toHaveBeenCalled();
    });

    it('stays silent when every import resolves in the pinned version', () => {
        Configuration.mainData.components = [
            {
                name: 'ButtonDemo',
                sourceCode: "import { CngxButton } from '@cngx/ui';\nexport class ButtonDemo {}",
                playgrounds: [{ title: 'OK', snippet: '<x />', language: 'html' }]
            }
        ] as never;

        new PlaygroundValidator().resolve(pinnedReader);
        expect(warn).not.toHaveBeenCalled();
    });

    it('validates imports inside a resolved file-ref bundle', () => {
        Configuration.mainData.playgroundFiles = {
            'TabsDemo:0': {
                entry: 'x.ts',
                files: {
                    'src/app/app.component.ts':
                        "import { CngxTabNav } from '@cngx/ui';\nexport class AppComponent {}"
                },
                bareSpecifiers: new Set(['@cngx/ui']),
                replacesAppComponent: true
            }
        } as never;
        Configuration.mainData.components = [
            {
                name: 'TabsDemo',
                sourceCode: '',
                playgrounds: [{ title: 'From file', fileRef: './x.ts' }]
            }
        ] as never;

        new PlaygroundValidator().resolve(pinnedReader);
        expect(warn).toHaveBeenCalledTimes(1);
        expect(warn.mock.calls[0][0]).toContain('CngxTabNav');
    });
});
