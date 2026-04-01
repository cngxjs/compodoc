
import { hasStderrError, temporaryDir, shell, read } from '../helpers';
const tmp = temporaryDir();

describe('CLI handlebars templates', () => {
    const distFolder = tmp.name + '-templates';

    describe('with alternative handlebar template files', () => {
        let indexFile, barComponentFile, fooComponentFile;

        beforeAll(() => {
            tmp.create(distFolder);

            const ls = shell('node', [
                './bin/index-cli.js',
                '-p',
                './test/fixtures/sample-files/tsconfig.simple.json',
                '--templates',
                './test/fixtures/test-templates',
                '-d',
                distFolder
            ]);

            if (hasStderrError(ls.stderr.toString())) {
                console.error(`shell error: ${ls.stderr.toString()}`);
                throw new Error('error');
            }
            indexFile = read(`${distFolder}/index.html`);
            barComponentFile = read(`${distFolder}/components/BarComponent.html`);
            fooComponentFile = read(`${distFolder}/components/FooComponent.html`);
        });
        afterAll(() => tmp.clean(distFolder));

        it('should use templated "page.hbs"', () => {
            expect(indexFile).to.contain('<span>THIS IS TEST CONTENT</span>');
            expect(indexFile).to.contain('<div class="content readme bg-info">');
        });

        it('should use partial "component-detail.hbs"', () => {
            expect(barComponentFile).not.to.contain('<td class="col-md-3">selector</td>');
            expect(barComponentFile).to.contain('<h3>Selector</h3>');
        });

        it('should use partial "block-constructor.hbs"', () => {
            expect(fooComponentFile).to.contain('<code>myprop</code>');
            expect(fooComponentFile).to.contain('<i><p>description</p>\n</i>');
        });
    });
});
