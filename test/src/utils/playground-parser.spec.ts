import { extractJsdocPlaygroundBlocks } from '../../../src/templates/helpers/jsdoc';

const playgroundTag = (comment: string) => ({
    tagName: { text: 'playground' },
    comment
});

const exampleTag = (comment: string) => ({
    tagName: { text: 'example' },
    comment
});

describe('extractJsdocPlaygroundBlocks', () => {
    it('extracts a single block with title, snippet, and language', () => {
        const tag = playgroundTag(
            ['Default state', '```html', '<my-button label="Click me" />', '```'].join('\n')
        );

        const { blocks, warnings } = extractJsdocPlaygroundBlocks([tag]);

        expect(warnings).to.deep.equal([]);
        expect(blocks).to.have.length(1);
        expect(blocks[0].title).to.equal('Default state');
        expect(blocks[0].language).to.equal('html');
        expect(blocks[0].snippet).to.equal('<my-button label="Click me" />');
    });

    it('preserves block order across multiple @playground tags', () => {
        const tags = [
            playgroundTag(['First', '```html', '<a/>', '```'].join('\n')),
            playgroundTag(['Second', '```html', '<b/>', '```'].join('\n')),
            playgroundTag(['Third', '```html', '<c/>', '```'].join('\n'))
        ];

        const { blocks } = extractJsdocPlaygroundBlocks(tags);

        expect(blocks.map(b => b.title)).to.deep.equal(['First', 'Second', 'Third']);
    });

    it('drops blocks without a title and surfaces a warning', () => {
        const tag = playgroundTag(['', '```html', '<x/>', '```'].join('\n'));

        const { blocks, warnings } = extractJsdocPlaygroundBlocks([tag]);

        expect(blocks).to.have.length(0);
        expect(warnings).to.have.length(1);
        expect(warnings[0]).to.contain('missing title');
    });

    it('drops blocks without a fenced body and surfaces a warning', () => {
        const tag = playgroundTag(
            ['Default state', 'Just some prose, no fence to be found.'].join('\n')
        );

        const { blocks, warnings } = extractJsdocPlaygroundBlocks([tag]);

        expect(blocks).to.have.length(0);
        expect(warnings).to.have.length(1);
        expect(warnings[0]).to.contain('Default state');
        expect(warnings[0]).to.contain('no fenced code body');
    });

    it('does not pick up @example tags', () => {
        const tags = [exampleTag(['```html', '<x/>', '```'].join('\n'))];

        const { blocks, warnings } = extractJsdocPlaygroundBlocks(tags);

        expect(blocks).to.have.length(0);
        expect(warnings).to.have.length(0);
    });

    it('reports the fence-open line offset relative to the comment', () => {
        const tag = playgroundTag(['Default', '', '', '```ts', "const x = 'y';", '```'].join('\n'));

        const { blocks } = extractJsdocPlaygroundBlocks([tag]);

        expect(blocks).to.have.length(1);
        expect(blocks[0].language).to.equal('typescript');
        // Title at line 0, two blank lines, fence opens at line 3.
        expect(blocks[0].line).to.equal(3);
    });

    describe('file-ref form', () => {
        it('parses a trailing .html path token into fileRef', () => {
            const tag = playgroundTag('Default ./examples/default.html');

            const { blocks, warnings } = extractJsdocPlaygroundBlocks([tag]);

            expect(warnings).to.deep.equal([]);
            expect(blocks).to.have.length(1);
            expect(blocks[0].title).to.equal('Default');
            expect(blocks[0].fileRef).to.equal('./examples/default.html');
            expect(blocks[0].snippet).to.be.undefined;
            expect(blocks[0].language).to.be.undefined;
        });

        it('parses a trailing .ts path token into fileRef', () => {
            const tag = playgroundTag('Counter ./examples/counter/counter-example.component.ts');

            const { blocks, warnings } = extractJsdocPlaygroundBlocks([tag]);

            expect(warnings).to.deep.equal([]);
            expect(blocks).to.have.length(1);
            expect(blocks[0].title).to.equal('Counter');
            expect(blocks[0].fileRef).to.equal('./examples/counter/counter-example.component.ts');
            expect(blocks[0].snippet).to.be.undefined;
        });

        it('preserves multi-word titles with internal slashes when followed by a path', () => {
            const tag = playgroundTag('With slashes / and dots ./foo.html');

            const { blocks, warnings } = extractJsdocPlaygroundBlocks([tag]);

            expect(warnings).to.deep.equal([]);
            expect(blocks).to.have.length(1);
            expect(blocks[0].title).to.equal('With slashes / and dots');
            expect(blocks[0].fileRef).to.equal('./foo.html');
        });

        it('falls through to inline form when title contains slashes but no path suffix', () => {
            const tag = playgroundTag(
                ['Title / with slashes', '```html', '<x/>', '```'].join('\n')
            );

            const { blocks, warnings } = extractJsdocPlaygroundBlocks([tag]);

            expect(warnings).to.deep.equal([]);
            expect(blocks).to.have.length(1);
            expect(blocks[0].title).to.equal('Title / with slashes');
            expect(blocks[0].fileRef).to.be.undefined;
            expect(blocks[0].snippet).to.equal('<x/>');
        });

        it('drops the block when fileRef and a fenced body coexist', () => {
            const tag = playgroundTag(['Title ./foo.html', '```html', '<x/>', '```'].join('\n'));

            const { blocks, warnings } = extractJsdocPlaygroundBlocks([tag]);

            expect(blocks).to.have.length(0);
            expect(warnings).to.have.length(1);
            expect(warnings[0]).to.contain('mutually exclusive');
            expect(warnings[0]).to.contain('Title');
        });

        it('drops a path-only tag (missing title) with a warning', () => {
            const tag = playgroundTag('./foo.html');

            const { blocks, warnings } = extractJsdocPlaygroundBlocks([tag]);

            expect(blocks).to.have.length(0);
            expect(warnings).to.have.length(1);
            expect(warnings[0]).to.contain('missing title');
        });

        it('does not match path-like text without an .html or .ts extension', () => {
            const tag = playgroundTag(
                ['Some title ./foo/bar.css', '```html', '<x/>', '```'].join('\n')
            );

            const { blocks } = extractJsdocPlaygroundBlocks([tag]);

            expect(blocks).to.have.length(1);
            expect(blocks[0].fileRef).to.be.undefined;
            expect(blocks[0].title).to.equal('Some title ./foo/bar.css');
            expect(blocks[0].snippet).to.equal('<x/>');
        });

        it('records the title-line offset on a file-ref block', () => {
            const tag = playgroundTag(['', '', 'Default ./examples/foo.html'].join('\n'));

            const { blocks } = extractJsdocPlaygroundBlocks([tag]);

            expect(blocks).to.have.length(1);
            // Title is at line 2, file-ref blocks point at the title line itself.
            expect(blocks[0].line).to.equal(2);
        });
    });
});
