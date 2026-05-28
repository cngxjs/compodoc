import { describe, expect, it } from 'vitest';
import {
    firstSentence,
    KIND_LABELS,
    pagefindMetaAttrs
} from '../../../../src/templates/helpers/pagefind-meta';

describe('firstSentence', () => {
    it('returns undefined for empty / nullish / non-string input', () => {
        expect(firstSentence(undefined)).toBeUndefined();
        expect(firstSentence(null)).toBeUndefined();
        expect(firstSentence('')).toBeUndefined();
        expect(firstSentence(42)).toBeUndefined();
    });

    it('returns undefined when input is whitespace-only after HTML strip', () => {
        expect(firstSentence('   ')).toBeUndefined();
        expect(firstSentence('<p>  </p>')).toBeUndefined();
        expect(firstSentence('<br/><br/>')).toBeUndefined();
    });

    it('strips HTML tags from rendered descriptions', () => {
        expect(firstSentence('<p>Hello <strong>world</strong>.</p>')).toBe('Hello world');
        expect(firstSentence('<code>Foo</code> bar baz')).toBe('Foo bar baz');
    });

    it('returns the first sentence when terminated by `.`, `!`, or `?`', () => {
        expect(firstSentence('First. Second.')).toBe('First');
        expect(firstSentence('Hey! World.')).toBe('Hey');
        expect(firstSentence('What? Then.')).toBe('What');
    });

    it('returns the entire stripped string when no sentence terminator exists', () => {
        expect(firstSentence('A clause with no terminator')).toBe('A clause with no terminator');
    });

    it('truncates over-long sentences at ~120 chars with ellipsis', () => {
        const long = `${'word '.repeat(40).trim()}.`;
        const result = firstSentence(long) as string;
        expect(result.length).toBeLessThanOrEqual(120);
        expect(result.endsWith('...')).toBe(true);
    });

    it('collapses whitespace runs and ignores tag boundaries', () => {
        expect(firstSentence('<p>Line\n  one.</p>\n<p>Line two.</p>')).toBe('Line one');
    });
});

describe('KIND_LABELS', () => {
    it('maps every EntityKind to a user-facing string', () => {
        expect(KIND_LABELS.component).toBe('Component');
        expect(KIND_LABELS.directive).toBe('Directive');
        expect(KIND_LABELS.pipe).toBe('Pipe');
        expect(KIND_LABELS.injectable).toBe('Injectable');
        expect(KIND_LABELS.class).toBe('Class');
        expect(KIND_LABELS.interface).toBe('Interface');
        expect(KIND_LABELS.guard).toBe('Guard');
        expect(KIND_LABELS.interceptor).toBe('Interceptor');
        expect(KIND_LABELS.entity).toBe('Entity');
        expect(KIND_LABELS.function).toBe('Function');
        expect(KIND_LABELS.variable).toBe('Variable');
        expect(KIND_LABELS.typealias).toBe('Type Alias');
        expect(KIND_LABELS.enumeration).toBe('Enumeration');
    });
});

describe('pagefindMetaAttrs', () => {
    it('returns an empty object when nothing is set', () => {
        expect(pagefindMetaAttrs({})).toEqual({});
    });

    it('omits the kind attr when kind is unknown', () => {
        const out = pagefindMetaAttrs({ kind: 'mystery' as any });
        expect(out).not.toHaveProperty('data-pagefind-meta-kind');
    });

    it('emits the kind label for a valid EntityKind', () => {
        expect(pagefindMetaAttrs({ kind: 'component' })).toEqual({
            'data-pagefind-meta-kind': 'Component'
        });
        expect(pagefindMetaAttrs({ kind: 'typealias' })).toEqual({
            'data-pagefind-meta-kind': 'Type Alias'
        });
    });

    it('omits category when empty or whitespace-only', () => {
        expect(pagefindMetaAttrs({ kind: 'component', category: '' })).toEqual({
            'data-pagefind-meta-kind': 'Component'
        });
        expect(pagefindMetaAttrs({ kind: 'component', category: '   ' })).toEqual({
            'data-pagefind-meta-kind': 'Component'
        });
    });

    it('emits a trimmed category when set', () => {
        expect(pagefindMetaAttrs({ kind: 'component', category: '  ui/feedback/toast  ' })).toEqual(
            {
                'data-pagefind-meta-kind': 'Component',
                'data-pagefind-meta-category': 'ui/feedback/toast'
            }
        );
    });

    it('omits description when it strips to empty', () => {
        expect(pagefindMetaAttrs({ kind: 'component', description: '<p>  </p>' })).toEqual({
            'data-pagefind-meta-kind': 'Component'
        });
    });

    it('emits the firstSentence excerpt for description', () => {
        expect(
            pagefindMetaAttrs({
                kind: 'interface',
                description: '<p>Options for the toaster. More details below.</p>'
            })
        ).toEqual({
            'data-pagefind-meta-kind': 'Interface',
            'data-pagefind-meta-description': 'Options for the toaster'
        });
    });

    it('emits all three attrs when every field is populated', () => {
        expect(
            pagefindMetaAttrs({
                kind: 'component',
                category: 'ui/feedback/toast',
                description: '<p>Toast component.</p>'
            })
        ).toEqual({
            'data-pagefind-meta-kind': 'Component',
            'data-pagefind-meta-category': 'ui/feedback/toast',
            'data-pagefind-meta-description': 'Toast component'
        });
    });
});
