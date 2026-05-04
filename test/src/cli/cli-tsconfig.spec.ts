import { hasStderrError, read, shell, temporaryDir } from '../helpers';

const tmp = temporaryDir();

describe('CLI tsconfig', () => {
    const tmpFolder = `${tmp.name}-tsconfig`;
    const distFolder = `${tmpFolder}/documentation`;

    describe('when specific files are included in tsconfig', () => {
        let moduleFile;
        beforeAll(() => {
            tmp.create(tmpFolder);
            tmp.copy('./test/fixtures/sample-files/', tmpFolder);

            const ls = shell(
                'node',
                ['../bin/index-cli.js', '-p', './tsconfig.entry.json', '-d', 'documentation'],
                { cwd: tmpFolder }
            );

            if (hasStderrError(ls.stderr.toString())) {
                console.error(`shell error: ${ls.stderr.toString()}`);
                throw new Error('error');
            }
            moduleFile = read(`${distFolder}/modules/AppModule.html`);
        });
        afterAll(() => tmp.clean(tmpFolder));

        it('should only create links to files included via tsconfig', () => {
            expect(moduleFile).to.contain('components/FooComponent.html');
            expect(moduleFile).to.contain('modules/FooModule.html');
            expect(moduleFile).not.to.contain('components/BarComponent.html');
            expect(moduleFile).not.to.contain('injectables/FooService.html');
            expect(moduleFile).not.to.contain('modules/BarModule.html');
        });
    });

    describe('when specific files are included in tsconfig + others', () => {
        let moduleFile;
        beforeAll(() => {
            tmp.create(tmpFolder);
            tmp.copy('./test/fixtures/sample-files/', tmpFolder);

            const ls = shell(
                'node',
                [
                    '../bin/index-cli.js',
                    '-p',
                    './tsconfig.entry-and-include.json',
                    '-d',
                    'documentation'
                ],
                { cwd: tmpFolder }
            );

            if (hasStderrError(ls.stderr.toString())) {
                console.error(`shell error: ${ls.stderr.toString()}`);
                throw new Error('error');
            }
            moduleFile = read(`${distFolder}/modules/AppModule.html`);
        });
        afterAll(() => tmp.clean(tmpFolder));

        it('should only create links to files included via tsconfig', () => {
            expect(moduleFile).to.contain('components/FooComponent.html');
            expect(moduleFile).to.contain('modules/FooModule.html');
            expect(moduleFile).to.contain('components/BarComponent.html');
            expect(moduleFile).not.to.contain('injectables/FooService.html');
            expect(moduleFile).not.to.contain('modules/BarModule.html');
        });
    });
});
