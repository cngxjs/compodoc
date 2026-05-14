import * as path from 'node:path';
import { SyntaxKind } from 'ts-morph';
import { describe, expect, it } from 'vitest';
import {
    type CoverageDependenciesInput,
    type CoverageFile,
    computeDocumentationCoverage,
    computeUnitTestCoverage
} from '../../../../src/app/services/coverage';

function emptyDeps(): CoverageDependenciesInput {
    return {
        components: [],
        directives: [],
        entities: [],
        classes: [],
        injectables: [],
        interfaces: [],
        guards: [],
        interceptors: [],
        pipes: [],
        miscellaneous: { functions: [], variables: [], typealiases: [] }
    };
}

describe('computeDocumentationCoverage', () => {
    it('returns count=0 / status="low" / files=[] for empty input', () => {
        const report = computeDocumentationCoverage(emptyDeps());
        expect(report.count).toBe(0);
        expect(report.status).toBe('low');
        expect(report.files).toEqual([]);
    });

    it('counts a component with described properties and methods', () => {
        const deps = emptyDeps();
        deps.components = [
            {
                file: 'a.ts',
                type: 'component',
                name: 'AComponent',
                description: 'has docs',
                propertiesClass: [{ description: 'x' }],
                methodsClass: [{ description: 'm' }],
                inputsClass: [],
                outputsClass: [],
                hostBindings: [],
                hostListeners: []
            }
        ];
        const report = computeDocumentationCoverage(deps);
        expect(report.files).toHaveLength(1);
        // 3 statements documented (class + prop + method) / 3 total (prop + method + decorator)
        expect(report.files[0].coveragePercent).toBe(100);
        expect(report.files[0].coverageCount).toBe('3/3');
        expect(report.files[0].status).toBe('very-good');
        expect(report.count).toBe(100);
    });

    it('drops private members from both the numerator and denominator', () => {
        const deps = emptyDeps();
        deps.components = [
            {
                file: 'a.ts',
                type: 'component',
                name: 'AComponent',
                description: '',
                propertiesClass: [
                    { description: 'public-doc' },
                    {
                        description: 'private-doc',
                        modifierKind: SyntaxKind.PrivateKeyword
                    }
                ],
                methodsClass: [],
                inputsClass: [],
                outputsClass: [],
                hostBindings: [],
                hostListeners: []
            }
        ];
        const report = computeDocumentationCoverage(deps);
        // Denominator: 2 props + decorator(1) - 1 private = 2.
        // Numerator: 1 public description (private description ignored).
        expect(report.files[0].coverageCount).toBe('1/2');
        expect(report.files[0].coveragePercent).toBe(50);
    });

    it('processes classes via processClasses for class/injectable/interface/guard/interceptor', () => {
        const deps = emptyDeps();
        deps.classes = [
            {
                file: 'cl.ts',
                name: 'AClass',
                description: 'docs',
                properties: [{ description: 'p' }],
                methods: []
            }
        ];
        const report = computeDocumentationCoverage(deps);
        expect(report.files).toHaveLength(1);
        expect(report.files[0].type).toBe('class');
        expect(report.files[0].linktype).toBe('classe');
        expect(report.files[0].coverageCount).toBe('2/2');
    });

    it('treats pipes as a single-statement entity (description present = 100%)', () => {
        const deps = emptyDeps();
        deps.pipes = [
            { file: 'p.ts', type: 'pipe', name: 'PPipe', description: 'docs' },
            { file: 'q.ts', type: 'pipe', name: 'QPipe', description: '' }
        ];
        const report = computeDocumentationCoverage(deps);
        const p = report.files.find(f => f.name === 'PPipe')!;
        const q = report.files.find(f => f.name === 'QPipe')!;
        expect(p.coveragePercent).toBe(100);
        expect(q.coveragePercent).toBe(0);
    });

    it('marks variable/function/type-alias entries with linktype=miscellaneous', () => {
        const deps = emptyDeps();
        deps.miscellaneous = {
            functions: [{ file: 'f.ts', name: 'fn', type: 'function', description: 'docs' }],
            variables: [{ file: 'v.ts', name: 'v', type: 'variable', description: '' }],
            typealiases: [{ file: 't.ts', name: 't', type: 'type alias', description: '' }]
        };
        const report = computeDocumentationCoverage(deps);
        expect(report.files.map(f => f.linktype).sort()).toEqual([
            'miscellaneous',
            'miscellaneous',
            'miscellaneous'
        ]);
    });

    it('sorts files alphabetically by filePath', () => {
        const deps = emptyDeps();
        deps.components = [
            {
                file: 'z.ts',
                type: 'component',
                name: 'Z',
                description: '',
                propertiesClass: [],
                methodsClass: [],
                inputsClass: [],
                outputsClass: [],
                hostBindings: [],
                hostListeners: []
            },
            {
                file: 'a.ts',
                type: 'component',
                name: 'A',
                description: '',
                propertiesClass: [],
                methodsClass: [],
                inputsClass: [],
                outputsClass: [],
                hostBindings: [],
                hostListeners: []
            }
        ];
        const report = computeDocumentationCoverage(deps);
        expect(report.files.map(f => f.filePath)).toEqual(['a.ts', 'z.ts']);
    });

    it('computes status thresholds: low/medium/good/very-good based on count', () => {
        // count = floor(sum / files.length); each entry contributes its coveragePercent
        // To exercise the threshold buckets, mix pipes with 0% and 100% descriptions.
        const lowDeps = emptyDeps();
        lowDeps.pipes = [
            { file: 'a.ts', type: 'pipe', name: 'a', description: '' },
            { file: 'b.ts', type: 'pipe', name: 'b', description: '' },
            { file: 'c.ts', type: 'pipe', name: 'c', description: '' },
            { file: 'd.ts', type: 'pipe', name: 'd', description: 'x' }
        ];
        // count = floor((0+0+0+100)/4) = 25 → low
        expect(computeDocumentationCoverage(lowDeps).status).toBe('low');

        const mediumDeps = emptyDeps();
        mediumDeps.pipes = [
            { file: 'a.ts', type: 'pipe', name: 'a', description: '' },
            { file: 'b.ts', type: 'pipe', name: 'b', description: 'x' }
        ];
        // count = 50 → medium
        expect(computeDocumentationCoverage(mediumDeps).status).toBe('medium');

        const goodDeps = emptyDeps();
        goodDeps.pipes = [
            { file: 'a.ts', type: 'pipe', name: 'a', description: '' },
            { file: 'b.ts', type: 'pipe', name: 'b', description: 'x' },
            { file: 'c.ts', type: 'pipe', name: 'c', description: 'x' },
            { file: 'd.ts', type: 'pipe', name: 'd', description: 'x' }
        ];
        // count = floor(300/4) = 75 → good
        expect(computeDocumentationCoverage(goodDeps).status).toBe('good');

        const veryGoodDeps = emptyDeps();
        veryGoodDeps.pipes = [{ file: 'a.ts', type: 'pipe', name: 'a', description: 'x' }];
        expect(computeDocumentationCoverage(veryGoodDeps).status).toBe('very-good');
    });
});

describe('computeUnitTestCoverage', () => {
    it('returns total + files keyed off the istanbul summary input', () => {
        const summary = {
            total: {
                statements: { pct: 80, covered: 8, total: 10 },
                branches: { pct: 50, covered: 5, total: 10 },
                functions: { pct: 100, covered: 4, total: 4 },
                lines: { pct: 75, covered: 6, total: 8 }
            },
            'src/app/a.ts': {
                statements: { pct: 80, covered: 4, total: 5 }
            }
        };
        const report = computeUnitTestCoverage(summary);
        expect(report.total.statements?.coveragePercent).toBe(80);
        expect(report.total.statements?.coverageCount).toBe('8/10');
        expect(report.total.statements?.status).toBe('very-good');
        expect(report.files).toHaveLength(1);
        expect(report.files[0].filePath).toBe('src/app/a.ts');
        expect(report.files[0].statements?.coveragePercent).toBe(80);
        expect(report.idColumn).toBe(false);
    });

    it('sets idColumn=true and enriches files when coverage-data files are provided', () => {
        // path.join keeps the summary key and the coverageFile.filePath on the
        // platform's native separator so `path.normalize` inside the matcher
        // does not mutate one side into a different shape on Windows.
        const filePath = path.join('src', 'app', 'a.ts');
        const summary = {
            [filePath]: { statements: { pct: 80, covered: 4, total: 5 } }
        };
        const coverageFiles: CoverageFile[] = [
            {
                filePath,
                type: 'component',
                linktype: 'component',
                name: 'AComponent',
                coveragePercent: 50,
                coverageCount: '1/2',
                status: 'medium'
            }
        ];
        const report = computeUnitTestCoverage(summary, coverageFiles);
        expect(report.idColumn).toBe(true);
        expect(report.files[0].name).toBe('AComponent');
        expect(report.files[0].type).toBe('component');
        expect(report.files[0].filePath).toBe(filePath);
    });

    it('reports uncovered status when total=0', () => {
        const summary = {
            'src/app/empty.ts': { lines: { pct: 0, covered: 0, total: 0 } }
        };
        const report = computeUnitTestCoverage(summary);
        expect(report.files[0].lines?.status).toBe('uncovered');
    });

    it('returns empty files array when summary contains only total', () => {
        const summary = {
            total: { statements: { pct: 100, covered: 1, total: 1 } }
        };
        const report = computeUnitTestCoverage(summary);
        expect(report.files).toEqual([]);
    });
});
