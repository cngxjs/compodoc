
import { temporaryDir, shell, pkg, exists, exec, read, shellAsync } from '../helpers';
const tmp = temporaryDir();

describe('CLI Analytics tracking', () => {
    const distFolder = tmp.name + '-tracking';

    describe('add tracking code', () => {
        let coverageFile;
        beforeAll(() => {
            tmp.create(distFolder);
            let ls = shell('node', [
                './bin/index-cli.js',
                '-p',
                './test/fixtures/sample-files/tsconfig.simple.json',
                '--gaID',
                'UA-XXXXX-Y',
                '--gaSite',
                'demo',
                '-d',
                distFolder
            ]);

            if (ls.stderr.toString() !== '') {
                console.error(`shell error: ${ls.stderr.toString()}`);
                throw new Error('error');
            }
            coverageFile = read(`${distFolder}/index.html`);
        });
        afterAll(() => tmp.clean(distFolder));

        it('it should contain tracking code', () => {
            expect(coverageFile).to.contain('www.google-analytics.com');
            expect(coverageFile).to.contain('demo');
        });
    });
});
