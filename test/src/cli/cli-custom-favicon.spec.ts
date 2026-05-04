import { exists, hasStderrError, shell, stats, temporaryDir } from '../helpers';

const tmp = temporaryDir();

interface Image {
    size: number;
}

describe('CLI custom favicon', () => {
    const distFolder = `${tmp.name}-favicon`;

    describe('when specifying a custom favicon', () => {
        beforeAll(() => {
            tmp.create(distFolder);
            const ls = shell('node', [
                './bin/index-cli.js',
                '-p',
                './test/fixtures/todomvc-ng2/src/tsconfig.json',
                '-d',
                distFolder,
                '--customFavicon',
                './test/fixtures/todomvc-ng2/favicon.ico'
            ]);

            if (hasStderrError(ls.stderr.toString())) {
                console.error(`shell error: ${ls.stderr.toString()}`);
                throw new Error('error');
            }
        });
        afterAll(() => tmp.clean(distFolder));

        it('should have copied the customFavicon', () => {
            const isFileExists = exists(`${distFolder}/images/favicon.ico`);
            expect(isFileExists).to.be.true;
            const originalFileSize = (stats('test/fixtures/todomvc-ng2/favicon.ico') as Image).size,
                copiedFileSize = (stats(`${distFolder}/images/favicon.ico`) as Image).size;
            expect(originalFileSize).to.equal(copiedFileSize);
        });
    });
});
