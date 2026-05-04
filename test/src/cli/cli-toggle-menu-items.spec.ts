import { hasStderrError, read, shell, temporaryDir } from '../helpers';

const tmp = temporaryDir();

describe('CLI toggle menu items', () => {
    describe('with a list', () => {
        const distFolder = `${tmp.name}-toggle`;
        let stdoutString, fooIndexFile, fooServiceFile;
        beforeAll(() => {
            tmp.create(distFolder);
            const ls = shell('node', [
                './bin/index-cli.js',
                '-p',
                './test/fixtures/todomvc-ng2/src/tsconfig.json',
                '-d',
                distFolder,
                '--toggleMenuItems',
                'modules'
            ]);

            if (hasStderrError(ls.stderr.toString())) {
                console.error(`shell error: ${ls.stderr.toString()}`);
                throw new Error('error');
            }
            stdoutString = ls.stdout.toString();
            fooIndexFile = read(`${distFolder}/js/menu-wc.js`);
        });
        afterAll(() => tmp.clean(distFolder));

        it('it should have a toggled item menu', () => {
            expect(fooIndexFile).to.contain('ion-ios-arrow-up');
        });
    });
});
