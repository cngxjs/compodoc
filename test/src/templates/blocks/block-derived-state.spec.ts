import { BlockDerivedState } from '../../../../src/templates/blocks/BlockDerivedState';

describe('BlockDerivedState', () => {
    const baseProps = {
        file: 'src/app/test.component.ts',
        depth: 0,
        navTabs: [{ id: 'source' }]
    };

    it('renders section with heading and data-compodoc attribute', () => {
        const html = BlockDerivedState({
            ...baseProps,
            properties: [{ name: 'x', signalKind: 'computed', defaultValue: 'computed(() => 1)' }],
            allSignalProps: []
        });

        expect(html).to.include('data-compodoc="block-derived-state"');
        expect(html).to.include('id="derived-state"');
    });

    it('renders computed badge for computed property', () => {
        const html = BlockDerivedState({
            ...baseProps,
            properties: [
                { name: 'val', signalKind: 'computed', defaultValue: 'computed(() => 1)' }
            ],
            allSignalProps: []
        });

        expect(html).to.include('cdx-badge--computed');
        expect(html).to.include('cdx-io-member--computed');
    });

    it('renders linked-signal badge for linkedSignal property', () => {
        const html = BlockDerivedState({
            ...baseProps,
            properties: [
                {
                    name: 'val',
                    signalKind: 'linked-signal',
                    defaultValue: 'linkedSignal(() => 1)'
                }
            ],
            allSignalProps: []
        });

        expect(html).to.include('cdx-badge--linked-signal');
        expect(html).to.include('cdx-io-member--linked-signal');
    });

    it('appends a Derives-from sentence when signal deps resolve to known signal props', () => {
        const html = BlockDerivedState({
            ...baseProps,
            properties: [
                {
                    name: 'total',
                    signalKind: 'computed',
                    signalDeps: ['count()', 'price()'],
                    defaultValue: 'computed(() => this.count() * this.price())'
                }
            ],
            allSignalProps: [
                { name: 'count', signalKind: 'signal' },
                { name: 'price', signalKind: 'signal' }
            ]
        });

        expect(html).to.include('Derives from');
        expect(html).to.match(/<code[^>]*>count\(\)<\/code>/);
        expect(html).to.match(/<code[^>]*>price\(\)<\/code>/);
        expect(html).to.include('\u00B7');
    });

    it('filters call-style deps to only known signal properties', () => {
        const html = BlockDerivedState({
            ...baseProps,
            properties: [
                {
                    name: 'label',
                    signalKind: 'computed',
                    signalDeps: ['name()', 'someService()'],
                    defaultValue: 'computed(() => this.name() + this.someService())'
                }
            ],
            allSignalProps: [{ name: 'name', signalKind: 'signal' }]
        });

        expect(html).to.match(/<code[^>]*>name\(\)<\/code>/);
        // someService() is a non-signal method call and must not appear in the Derives-from list
        expect(html).to.not.match(/<code[^>]*>someService/);
    });

    it('always includes plain property access without a signal filter', () => {
        const html = BlockDerivedState({
            ...baseProps,
            properties: [
                {
                    name: 'ready',
                    signalKind: 'computed',
                    signalDeps: ['rovingParent', 'interactive()'],
                    defaultValue: 'computed(() => this.rovingParent && this.interactive())'
                }
            ],
            allSignalProps: [{ name: 'interactive', signalKind: 'signal' }]
        });

        expect(html).to.match(/<code[^>]*>rovingParent<\/code>/);
        expect(html).to.match(/<code[^>]*>interactive\(\)<\/code>/);
    });

    it('omits the sentence when no deps survive filtering', () => {
        const html = BlockDerivedState({
            ...baseProps,
            properties: [
                {
                    name: 'val',
                    signalKind: 'computed',
                    signalDeps: ['unknownMethod()'],
                    defaultValue: 'computed(() => 42)'
                }
            ],
            allSignalProps: []
        });

        expect(html).to.not.include('Derives from');
    });

    it('omits the sentence when signalDeps is empty', () => {
        const html = BlockDerivedState({
            ...baseProps,
            properties: [
                {
                    name: 'val',
                    signalKind: 'computed',
                    defaultValue: 'computed(() => 42)'
                }
            ],
            allSignalProps: []
        });

        expect(html).to.not.include('Derives from');
    });

    it('does not render the legacy chain markup', () => {
        const html = BlockDerivedState({
            ...baseProps,
            properties: [
                {
                    name: 'sum',
                    signalKind: 'computed',
                    signalDeps: ['a()', 'b()'],
                    defaultValue: 'computed(() => this.a() + this.b())'
                }
            ],
            allSignalProps: [
                { name: 'a', signalKind: 'signal' },
                { name: 'b', signalKind: 'signal' }
            ]
        });

        expect(html).to.not.include('cdx-derived-chain');
        expect(html).to.not.include('cdx-derived-dep');
        expect(html).to.not.include('cdx-derived-sep');
        expect(html).to.not.include('cdx-derived-arrow');
        expect(html).to.not.include('cdx-derived-self');
    });

    it('renders source link with line number', () => {
        const html = BlockDerivedState({
            ...baseProps,
            properties: [
                {
                    name: 'x',
                    signalKind: 'computed',
                    defaultValue: 'computed(() => 1)',
                    line: 42
                }
            ],
            allSignalProps: []
        });

        expect(html).to.include('data-cdx-line="42"');
        expect(html).to.include('src/app/test.component.ts:42');
    });

    it('renders description and sentence together inside the same desc block', () => {
        const html = BlockDerivedState({
            ...baseProps,
            properties: [
                {
                    name: 'x',
                    signalKind: 'computed',
                    signalDeps: ['count()'],
                    defaultValue: 'computed(() => this.count())',
                    description: 'A computed value'
                }
            ],
            allSignalProps: [{ name: 'count', signalKind: 'signal' }]
        });

        expect(html).to.include('cdx-io-member-desc');
        expect(html).to.include('A computed value');
        expect(html).to.include('Derives from');
        expect(html).to.match(/<code[^>]*>count\(\)<\/code>/);
    });

    it('renders the sentence alone when there is no description', () => {
        const html = BlockDerivedState({
            ...baseProps,
            properties: [
                {
                    name: 'x',
                    signalKind: 'computed',
                    signalDeps: ['a()'],
                    defaultValue: 'computed(() => this.a())'
                }
            ],
            allSignalProps: [{ name: 'a', signalKind: 'signal' }]
        });

        expect(html).to.include('cdx-io-member-desc');
        expect(html).to.include('Derives from');
    });

    it('inserts a middle-dot separator between multiple deps', () => {
        const html = BlockDerivedState({
            ...baseProps,
            properties: [
                {
                    name: 'sum',
                    signalKind: 'computed',
                    signalDeps: ['a()', 'b()'],
                    defaultValue: 'computed(() => this.a() + this.b())'
                }
            ],
            allSignalProps: [
                { name: 'a', signalKind: 'signal' },
                { name: 'b', signalKind: 'signal' }
            ]
        });

        expect(html).to.match(
            /<code[^>]*>a\(\)<\/code>[^<]*\u00B7[^<]*<code[^>]*>b\(\)<\/code>/
        );
    });
});
