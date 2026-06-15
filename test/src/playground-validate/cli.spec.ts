import * as os from 'node:os';
import * as path from 'node:path';
import * as fs from 'fs-extra';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { runPlaygroundValidateCli } from '../../../src/playground-validate';

/**
 * End-to-end exercise of the real CLI path — HTML discovery, project
 * materialization, real `spawnSync`, summary, and exit code — WITHOUT npm or
 * Angular. `--installCmd`/`--buildCmd` are pointed at trivial `node -e`
 * processes so the plumbing is real but the run is milliseconds. The actual
 * npm-install + ng-build e2e is too slow/networked for the unit suite and is
 * meant to run as a CI job invoking the published command.
 */

const manifestScript = (id: string, title: string): string => {
    const manifest = {
        title,
        description: '',
        template: 'node',
        files: { 'package.json': '{"name":"x"}', 'src/main.ts': 'export const x = 1;' },
        dependencies: {},
        tags: [],
        openFile: 'src/app/app.component.ts',
        startScript: 'start'
    };
    return `<script type="application/json" data-cdx-stackblitz-manifest-data="${id}">${JSON.stringify(manifest)}</script>`;
};

describe('runPlaygroundValidateCli (e2e plumbing)', () => {
    let docsDir: string;
    let stdout: ReturnType<typeof vi.spyOn>;
    let stderr: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
        docsDir = fs.mkdtempSync(path.join(os.tmpdir(), 'compodocx-docs-'));
        stdout = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
        stderr = vi.spyOn(process.stderr, 'write').mockImplementation(() => true);
    });

    afterEach(() => {
        stdout.mockRestore();
        stderr.mockRestore();
        fs.removeSync(docsDir);
    });

    const writeDoc = (name: string, html: string): void =>
        fs.writeFileSync(path.join(docsDir, name), html, 'utf8');

    it('exits 0 when every playground install+build succeeds', async () => {
        writeDoc('a.html', manifestScript('pg-0', 'Default'));
        const code = await runPlaygroundValidateCli([
            docsDir,
            '--installCmd',
            'node -e 0',
            '--buildCmd',
            'node -e 0'
        ]);
        expect(code).to.equal(0);
    });

    it('exits 1 when a build command fails', async () => {
        writeDoc('a.html', manifestScript('pg-0', 'Broken'));
        const code = await runPlaygroundValidateCli([
            docsDir,
            '--installCmd',
            'node -e 0',
            '--buildCmd',
            'node -e process.exit(1)'
        ]);
        expect(code).to.equal(1);
    });

    it('materializes the manifest files onto disk before building', async () => {
        writeDoc('a.html', manifestScript('pg-keep', 'Keep'));
        // --buildCmd asserts src/main.ts was written into the project dir.
        const code = await runPlaygroundValidateCli([
            docsDir,
            '--installCmd',
            'node -e 0',
            '--buildCmd',
            'node -e require("fs").statSync("src/main.ts")'
        ]);
        expect(code).to.equal(0);
    });

    it('dedupes a playground that renders on multiple pages', async () => {
        writeDoc('a.html', manifestScript('pg-dup', 'Shared'));
        writeDoc('b.html', manifestScript('pg-dup', 'Shared'));
        const builds = 0;
        // Count build invocations by writing a marker; simpler: assert exit 0
        // and that only one project dir is produced via --keep inspection.
        const code = await runPlaygroundValidateCli([
            docsDir,
            '--installCmd',
            'node -e 0',
            '--buildCmd',
            'node -e 0'
        ]);
        void builds;
        expect(code).to.equal(0);
        // Both pages carry the same id → one summary line only.
        const printed = stdout.mock.calls.map(c => String(c[0])).join('');
        expect(printed).to.contain('1 playground(s)');
    });

    it('exits 2 for a missing docs directory', async () => {
        const code = await runPlaygroundValidateCli([path.join(docsDir, 'does-not-exist')]);
        expect(code).to.equal(2);
    });

    it('exits 0 with a notice when no manifests are present', async () => {
        writeDoc('plain.html', '<html><body>nothing here</body></html>');
        const code = await runPlaygroundValidateCli([docsDir]);
        expect(code).to.equal(0);
        const printed = stdout.mock.calls.map(c => String(c[0])).join('');
        expect(printed).to.contain('no @playground manifests');
    });

    it('--filter narrows to matching playgrounds', async () => {
        writeDoc('a.html', manifestScript('pg-a', 'Alpha') + manifestScript('pg-b', 'Beta'));
        const code = await runPlaygroundValidateCli([
            docsDir,
            '--filter',
            'alpha',
            '--installCmd',
            'node -e 0',
            '--buildCmd',
            'node -e 0'
        ]);
        expect(code).to.equal(0);
        const printed = stdout.mock.calls.map(c => String(c[0])).join('');
        expect(printed).to.contain('1 playground(s)');
    });
});
