import { describe, expect, it } from 'vitest';
import {
    detectLegacyArtefacts,
    hasAnyLegacy,
    type PackageJsonLike
} from '../../../../schematics/ng-add/detect';

describe('detectLegacyArtefacts', () => {
    it('returns an empty finding for a clean package.json', () => {
        const pkg: PackageJsonLike = { devDependencies: { typescript: '^5.0.0' } };
        const finding = detectLegacyArtefacts(pkg, false);

        expect(finding.hasCompodocDep).toBe(false);
        expect(finding.legacyScriptKeys).toEqual([]);
        expect(finding.legacyScriptInvocations).toEqual([]);
        expect(finding.hasTsconfigDoc).toBe(false);
        expect(hasAnyLegacy(finding)).toBe(false);
    });

    it('detects @compodoc/compodoc as a devDependency', () => {
        const pkg: PackageJsonLike = { devDependencies: { '@compodoc/compodoc': '^1.1.0' } };
        const finding = detectLegacyArtefacts(pkg, false);

        expect(finding.hasCompodocDep).toBe(true);
        expect(hasAnyLegacy(finding)).toBe(true);
    });

    it('detects @compodoc/compodoc as a runtime dependency', () => {
        const pkg: PackageJsonLike = { dependencies: { '@compodoc/compodoc': '^1.1.0' } };
        const finding = detectLegacyArtefacts(pkg, false);

        expect(finding.hasCompodocDep).toBe(true);
    });

    it('detects legacy script keys (compodoc:* prefix)', () => {
        const pkg: PackageJsonLike = {
            scripts: {
                'compodoc:build': 'compodoc -p tsconfig.doc.json',
                'compodoc:serve': 'compodoc -s'
            }
        };
        const finding = detectLegacyArtefacts(pkg, false);

        expect(finding.legacyScriptKeys.sort()).toEqual(['compodoc:build', 'compodoc:serve']);
        expect(finding.legacyScriptInvocations.sort()).toEqual([
            'compodoc:build',
            'compodoc:serve'
        ]);
    });

    it('detects legacy invocation when scripts use npx compodoc or node_modules/.bin/compodoc', () => {
        const pkg: PackageJsonLike = {
            scripts: {
                'docs:build': 'npx compodoc -p tsconfig.doc.json',
                'docs:dev': 'node_modules/.bin/compodoc -s'
            }
        };
        const finding = detectLegacyArtefacts(pkg, false);

        expect(finding.legacyScriptKeys).toEqual([]);
        expect(finding.legacyScriptInvocations.sort()).toEqual(['docs:build', 'docs:dev']);
        expect(hasAnyLegacy(finding)).toBe(true);
    });

    it('does not flag compodocx:* script keys as legacy', () => {
        const pkg: PackageJsonLike = {
            scripts: {
                'compodocx:build': 'compodocx -p tsconfig.doc.json',
                'compodocx:serve': 'compodocx -s'
            }
        };
        const finding = detectLegacyArtefacts(pkg, false);

        expect(finding.legacyScriptKeys).toEqual([]);
        expect(finding.legacyScriptInvocations).toEqual([]);
        expect(hasAnyLegacy(finding)).toBe(false);
    });

    it('does not flag scripts that mention compodocx in their value', () => {
        const pkg: PackageJsonLike = {
            scripts: {
                'docs:build': 'compodocx -p tsconfig.doc.json'
            }
        };
        const finding = detectLegacyArtefacts(pkg, false);

        expect(finding.legacyScriptInvocations).toEqual([]);
    });

    it('reports devDep + scripts + tsconfig together', () => {
        const pkg: PackageJsonLike = {
            devDependencies: { '@compodoc/compodoc': '^1.1.0' },
            scripts: {
                'compodoc:build': 'compodoc -p tsconfig.doc.json',
                lint: 'eslint .'
            }
        };
        const finding = detectLegacyArtefacts(pkg, true);

        expect(finding.hasCompodocDep).toBe(true);
        expect(finding.legacyScriptKeys).toEqual(['compodoc:build']);
        expect(finding.legacyScriptInvocations).toEqual(['compodoc:build']);
        expect(finding.hasTsconfigDoc).toBe(true);
        expect(hasAnyLegacy(finding)).toBe(true);
    });
});
