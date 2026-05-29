import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { resolveTsconfigPaths } from '../../../src/utils/utils';

describe('resolveTsconfigPaths', () => {
    let tmpDir: string;

    beforeEach(() => {
        tmpDir = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'cdx-tspaths-')));
    });

    afterEach(() => {
        fs.rmSync(tmpDir, { recursive: true, force: true });
    });

    const write = (name: string, content: object) => {
        fs.writeFileSync(path.join(tmpDir, name), JSON.stringify(content, null, 2));
    };

    it('reads paths declared directly in the active tsconfig', () => {
        write('tsconfig.json', {
            compilerOptions: {
                baseUrl: '.',
                paths: {
                    '@cngx/ui/feedback': ['projects/ui/feedback/public-api.ts']
                }
            }
        });

        const result = resolveTsconfigPaths(path.join(tmpDir, 'tsconfig.json'), tmpDir);

        expect(result.paths).toEqual({
            '@cngx/ui/feedback': ['projects/ui/feedback/public-api.ts']
        });
        expect(result.baseUrl).toBe('.');
    });

    it('walks a 3-level extends chain and inherits paths from the base', () => {
        write('tsconfig.base.json', {
            compilerOptions: {
                baseUrl: '.',
                paths: {
                    '@cngx/common': ['projects/common/public-api.ts'],
                    '@cngx/ui/feedback': ['projects/ui/feedback/public-api.ts']
                }
            }
        });
        write('tsconfig.json', { extends: './tsconfig.base.json' });
        write('tsconfig.doc.json', { extends: './tsconfig.json' });

        const result = resolveTsconfigPaths(path.join(tmpDir, 'tsconfig.doc.json'), tmpDir);

        expect(result.paths).toEqual({
            '@cngx/common': ['projects/common/public-api.ts'],
            '@cngx/ui/feedback': ['projects/ui/feedback/public-api.ts']
        });
        expect(result.baseUrl).toBe('.');
    });

    it('lets the leaf tsconfig override paths declared in an ancestor', () => {
        write('tsconfig.base.json', {
            compilerOptions: {
                baseUrl: '.',
                paths: {
                    '@cngx/common': ['old/path/public-api.ts']
                }
            }
        });
        write('tsconfig.doc.json', {
            extends: './tsconfig.base.json',
            compilerOptions: {
                paths: {
                    '@cngx/common': ['new/path/public-api.ts']
                }
            }
        });

        const result = resolveTsconfigPaths(path.join(tmpDir, 'tsconfig.doc.json'), tmpDir);

        expect(result.paths['@cngx/common']).toEqual(['new/path/public-api.ts']);
    });

    it('returns relative baseUrl when projectRoot differs from tsconfig directory', () => {
        const sub = path.join(tmpDir, 'config');
        fs.mkdirSync(sub);
        fs.writeFileSync(
            path.join(sub, 'tsconfig.json'),
            JSON.stringify({
                compilerOptions: {
                    baseUrl: '..',
                    paths: { '@x': ['x/public-api.ts'] }
                }
            })
        );

        const result = resolveTsconfigPaths(path.join(sub, 'tsconfig.json'), tmpDir);

        expect(result.baseUrl).toBe('.');
    });

    it('returns non-dot relative baseUrl when baseUrl resolves to a subdirectory of projectRoot', () => {
        fs.mkdirSync(path.join(tmpDir, 'packages'));
        write('tsconfig.json', {
            compilerOptions: {
                baseUrl: './packages',
                paths: { '@lib/shared': ['shared/public-api.ts'] }
            }
        });

        const result = resolveTsconfigPaths(path.join(tmpDir, 'tsconfig.json'), tmpDir);

        expect(result.baseUrl).toBe('packages');
    });

    it('returns empty paths and baseUrl when no paths anywhere in the chain', () => {
        write('tsconfig.base.json', { compilerOptions: { target: 'es2022' } });
        write('tsconfig.json', { extends: './tsconfig.base.json' });

        const result = resolveTsconfigPaths(path.join(tmpDir, 'tsconfig.json'), tmpDir);

        expect(result.paths).toEqual({});
        expect(result.baseUrl).toBe('');
    });

    it('does not throw and returns empty when the tsconfig file is missing', () => {
        const result = resolveTsconfigPaths(path.join(tmpDir, 'does-not-exist.json'), tmpDir);
        expect(result.paths).toEqual({});
        expect(result.baseUrl).toBe('');
    });
});
