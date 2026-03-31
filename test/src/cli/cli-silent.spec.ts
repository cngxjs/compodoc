
import { exec, shell, temporaryDir } from '../helpers';
const tmp = temporaryDir();

describe('CLI silent flag', () => {
    const distFolder = tmp.name + '-silent';
    let stdoutString = '';

    beforeAll(() => {
        tmp.create(distFolder);
        let ls = shell('node', [
            './bin/index-cli.js',
            '-p',
            './test/fixtures/sample-files/tsconfig.simple.json',
            '-d',
            distFolder,
            '--silent'
        ]);

        if (ls.stderr.toString() !== '') {
            console.error(`shell error: ${ls.stderr.toString()}`);
            throw new Error('error');
        }
        stdoutString = ls.stdout.toString();
    });
    afterAll(() => tmp.clean(distFolder));

    it('should display simple message', () => {
        expect(stdoutString).to.contain('Compodoc v');
        expect(stdoutString).not.to.contain('TypeScript version used by Compodoc');
    });
});

describe('CLI silent flag - error', () => {
    let exitCode = 0;
    let stdoutString = '';

    const distFolder = tmp.name + '-silent-error';

    beforeAll(() => {
        tmp.create(distFolder);
        const ls = exec(
            'node' +
                [
                    '',
                    './bin/index-cli.js',
                    '-p',
                    './test/fixtures/sample-files/tsconfig.simple.json',
                    '-d',
                    distFolder,
                    '--silent',
                    '--includes',
                    './test/fixtures/todomvc-ng2/additional-doc-wrong'
                ].join(' '),
            (error, stdout) => {
                stdoutString = stdout;
            }
        );
        ls.on('close', code => {
            exitCode = code;
        });
    });
    afterAll(() => tmp.clean(distFolder));

    it('should exit with code 1 and log error', () => {
        expect(exitCode).to.equal(1);
        expect(stdoutString).to.contain('Error during Additional documentation generation');
    });
});
