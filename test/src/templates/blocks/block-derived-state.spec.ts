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
            properties: [{ name: 'val', signalKind: 'computed', defaultValue: 'computed(() => 1)' }],
            allSignalProps: []
        });

        expect(html).to.include('cdx-badge--computed');
        expect(html).to.include('cdx-io-member--computed');
    });

    it('renders linked-signal badge for linkedSignal property', () => {
        const html = BlockDerivedState({
            ...baseProps,
            properties: [{
                name: 'val',
                signalKind: 'linked-signal',
                defaultValue: 'linkedSignal(() => 1)'
            }],
            allSignalProps: []
        });

        expect(html).to.include('cdx-badge--linked-signal');
        expect(html).to.include('cdx-io-member--linked-signal');
    });

    it('renders code body in pre block', () => {
        const html = BlockDerivedState({
            ...baseProps,
            properties: [{
                name: 'x',
                signalKind: 'computed',
                defaultValue: 'computed(() => this.a() + this.b())'
            }],
            allSignalProps: []
        });

        expect(html).to.include('cdx-derived-body');
        // kitajs/html escapes angle brackets in text content
        expect(html).to.include('this.a() + this.b()');
    });

    it('renders dependency chain when signalDeps match known signal props', () => {
        const html = BlockDerivedState({
            ...baseProps,
            properties: [{
                name: 'total',
                signalKind: 'computed',
                signalDeps: ['count', 'price'],
                defaultValue: 'computed(() => this.count() * this.price())'
            }],
            allSignalProps: [
                { name: 'count', signalKind: 'signal' },
                { name: 'price', signalKind: 'signal' }
            ]
        });

        expect(html).to.include('cdx-derived-chain');
        expect(html).to.include('cdx-derived-dep');
        expect(html).to.include('href="#count"');
        expect(html).to.include('href="#price"');
        expect(html).to.include('cdx-derived-self');
        expect(html).to.include('>total<');
    });

    it('filters signalDeps to only known signal properties', () => {
        const html = BlockDerivedState({
            ...baseProps,
            properties: [{
                name: 'label',
                signalKind: 'computed',
                signalDeps: ['name', 'someService'],
                defaultValue: 'computed(() => this.name() + this.someService())'
            }],
            allSignalProps: [
                { name: 'name', signalKind: 'signal' }
                // someService is NOT a signal prop
            ]
        });

        expect(html).to.include('href="#name"');
        expect(html).to.not.include('href="#someService"');
    });

    it('omits dependency chain when no signalDeps match', () => {
        const html = BlockDerivedState({
            ...baseProps,
            properties: [{
                name: 'val',
                signalKind: 'computed',
                signalDeps: ['unknownMethod'],
                defaultValue: 'computed(() => 42)'
            }],
            allSignalProps: []
        });

        expect(html).to.not.include('cdx-derived-chain');
    });

    it('omits dependency chain when signalDeps is empty', () => {
        const html = BlockDerivedState({
            ...baseProps,
            properties: [{
                name: 'val',
                signalKind: 'computed',
                defaultValue: 'computed(() => 42)'
            }],
            allSignalProps: []
        });

        expect(html).to.not.include('cdx-derived-chain');
    });

    it('renders source link with line number', () => {
        const html = BlockDerivedState({
            ...baseProps,
            properties: [{
                name: 'x',
                signalKind: 'computed',
                defaultValue: 'computed(() => 1)',
                line: 42
            }],
            allSignalProps: []
        });

        expect(html).to.include('data-cdx-line="42"');
        expect(html).to.include('src/app/test.component.ts:42');
    });

    it('renders description when present', () => {
        const html = BlockDerivedState({
            ...baseProps,
            properties: [{
                name: 'x',
                signalKind: 'computed',
                defaultValue: 'computed(() => 1)',
                description: 'A computed value'
            }],
            allSignalProps: []
        });

        expect(html).to.include('cdx-io-member-desc');
        expect(html).to.include('A computed value');
    });

    it('renders dot separator between multiple deps', () => {
        const html = BlockDerivedState({
            ...baseProps,
            properties: [{
                name: 'sum',
                signalKind: 'computed',
                signalDeps: ['a', 'b'],
                defaultValue: 'computed(() => this.a() + this.b())'
            }],
            allSignalProps: [
                { name: 'a', signalKind: 'signal' },
                { name: 'b', signalKind: 'signal' }
            ]
        });

        expect(html).to.include('cdx-derived-sep');
    });

    it('renders arrow before self chip', () => {
        const html = BlockDerivedState({
            ...baseProps,
            properties: [{
                name: 'x',
                signalKind: 'computed',
                signalDeps: ['a'],
                defaultValue: 'computed(() => this.a())'
            }],
            allSignalProps: [{ name: 'a', signalKind: 'signal' }]
        });

        expect(html).to.include('cdx-derived-arrow');
    });
});
