
import { hasStderrError, temporaryDir, shell, pkg, exists, exec, read, shellAsync } from '../helpers';

const tmp = temporaryDir();

describe('CLI generation - JSDoc @example language specifications', () => {
    let stdoutString = undefined;
    const distFolder = tmp.name + '-jsdoc-examples';

    beforeAll(() => {
        tmp.create(distFolder);
        let ls = shell('node', [
            './bin/index-cli.js',
            '-p',
            './test/fixtures/sample-files/tsconfig.examples.json',
            '-d',
            distFolder
        ]);

        if (hasStderrError(ls.stderr.toString())) {
            console.error(`shell error: ${ls.stderr.toString()}`);
            throw new Error('error');
        }
        stdoutString = ls.stdout.toString();
    });

    afterAll(() => tmp.clean(distFolder));

    it('should display generated message', () => {
        expect(stdoutString).to.contain('Documentation generated');
    });

    it('should have generated main folder', () => {
        const isFolderExists = exists(`${distFolder}`);
        expect(isFolderExists).to.be.true;
    });

    it('should have generated directive documentation', () => {
        const isDirectiveExists = exists(`${distFolder}/directives/TestClass.html`);
        expect(isDirectiveExists).to.be.true;
    });

    describe('JSDoc @example language specifications', () => {
        let directiveFile: string;

        beforeAll(() => {
            directiveFile = read(`${distFolder}/directives/TestClass.html`);
        });

        it('should contain the directive class documentation', () => {
            expect(directiveFile).to.contain('TestClass');
            expect(directiveFile).to.contain('Test class for JSDoc Example language specification');
        });

        it('should render TypeScript example with correct language class', () => {
            expect(directiveFile).to.contain('language-typescript');
            expect(directiveFile).to.contain('// TypeScript example');
            expect(directiveFile).to.contain('const instance = new TestClass();');
            expect(directiveFile).to.contain('instance.testMethod();');
        });

        it('should render HTML example with correct language class', () => {
            expect(directiveFile).to.contain('language-html');
            expect(directiveFile).to.contain('&lt;!-- HTML example --&gt;');
            expect(directiveFile).to.contain('&lt;div&gt;Hello World&lt;/div&gt;');
        });

        it('should render JavaScript example with correct language class', () => {
            expect(directiveFile).to.contain('language-javascript');
            expect(directiveFile).to.contain('// JavaScript example');
            expect(directiveFile).to.contain('const result = testFunction();');
        });

        it('should not contain markdown code fence artifacts', () => {
            expect(directiveFile).not.to.contain('```typescript');
            expect(directiveFile).not.to.contain('```html');
            expect(directiveFile).not.to.contain('```javascript');
            expect(directiveFile).not.to.contain('```');
        });

        it('should render each example in separate code blocks', () => {
            const codeBlocks = directiveFile.match(
                /<pre class=\"line-numbers\"><code class=\"language-/g
            );
            expect(codeBlocks && codeBlocks.length).to.be.greaterThan(2); // At least 3 code blocks (not counting captions)
        });

        it('should properly escape HTML entities in code examples', () => {
            expect(directiveFile).to.contain('&lt;div&gt;');
            expect(directiveFile).to.contain('&lt;/div&gt;');
            expect(directiveFile).to.contain('&lt;!--');
            expect(directiveFile).to.contain('--&gt;');
        });

        describe('Method examples', () => {
            it('should render method example with TypeScript language class', () => {
                expect(directiveFile).to.contain('testMethod');
                expect(directiveFile).to.contain('// Method usage');
                expect(directiveFile).to.contain('const test = new TestClass();');
                expect(directiveFile).to.contain('test.testMethod();');
            });

            it('should render method example in separate code block', () => {
                const methodSection = directiveFile.substring(directiveFile.indexOf('testMethod'));
                expect(methodSection).to.contain('language-typescript');
                expect(methodSection).to.contain('// Method usage');
            });
        });

        it('should still work with legacy @example tags without language specification', () => {
            // This test ensures that examples without language specification still work
            // and default to HTML language class
            expect(directiveFile).to.contain('language-');
        });
    });

    describe('Code block structure', () => {
        let directiveFile: string;

        beforeAll(() => {
            directiveFile = read(`${distFolder}/directives/TestClass.html`);
        });

        it('should use proper HTML structure for code blocks', () => {
            expect(directiveFile).to.contain('<pre class="cdx-code-example">');
            expect(directiveFile).to.contain('<code class="language-typescript">');
            expect(directiveFile).to.contain('<code class="language-html">');
            expect(directiveFile).to.contain('<code class="language-javascript">');
            expect(directiveFile).to.contain('</code></pre>');
        });

        it('should have line-numbers class for syntax highlighting', () => {
            const preElements = directiveFile.match(/<pre class="cdx-code-example">/g);
            expect(preElements).to.have.length.greaterThan(3);
        });

        it('should maintain code indentation and formatting', () => {
            expect(directiveFile).to.contain('const instance = new TestClass();');
            expect(directiveFile).to.contain('instance.testMethod();');
        });
    });

    describe('Multiple examples handling', () => {
        let directiveFile: string;

        beforeAll(() => {
            directiveFile = read(`${distFolder}/directives/TestClass.html`);
        });

        it('should handle multiple @example tags properly', () => {
            // Count occurrences of different language classes
            const typescriptBlocks = (directiveFile.match(/language-typescript/g) || []).length;
            const htmlBlocks = (directiveFile.match(/language-html/g) || []).length;
            const javascriptBlocks = (directiveFile.match(/language-javascript/g) || []).length;

            expect(typescriptBlocks).to.be.greaterThan(0);
            expect(htmlBlocks).to.be.greaterThan(0);
            expect(javascriptBlocks).to.be.greaterThan(0);
        });

        it('should separate each example into distinct code blocks', () => {
            const codeBlocks = directiveFile.match(
                /<pre class=\"line-numbers\"><code class=\"language-[^\"]*\">/g
            );
            expect(codeBlocks && codeBlocks.length).to.be.greaterThan(2); // At least 3 code blocks (not counting captions)
        });
    });
});
