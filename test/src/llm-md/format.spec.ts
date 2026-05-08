import { describe, expect, it } from 'vitest';
import {
    collapseDescription,
    collapseSignatureWhitespace,
    deprecatedTail,
    escapeMarkdown,
    formatMethodSignature,
    formatPropertySignature,
    inlineCode,
    joinSections,
    SIGNATURE_VALUE_CAP
} from '../../../src/llm-md/format';

describe('llm-md/format — escapeMarkdown', () => {
    it('returns empty string for falsy input', () => {
        expect(escapeMarkdown(undefined)).toBe('');
        expect(escapeMarkdown('')).toBe('');
    });

    it('escapes backticks asterisks underscores brackets pipes and angle brackets', () => {
        const out = escapeMarkdown('A `code` *star* _under_ [link] | <html> ');
        expect(out).toBe('A \\`code\\` \\*star\\* \\_under\\_ \\[link\\] \\| \\<html\\> ');
    });

    it('escapes leading hash on every line so headings cannot leak through', () => {
        const out = escapeMarkdown('# heading\n# another');
        expect(out).toBe('\\# heading\n\\# another');
    });

    it('escapes backslashes first to avoid doubling escapes downstream', () => {
        expect(escapeMarkdown('a\\b')).toBe('a\\\\b');
    });
});

describe('llm-md/format — inlineCode', () => {
    it('wraps trimmed input in single backticks', () => {
        expect(inlineCode(' foo ')).toBe('`foo`');
    });

    it('returns the empty fence when input is empty or whitespace-only', () => {
        expect(inlineCode(undefined)).toBe('``');
        expect(inlineCode('   ')).toBe('``');
    });

    it('widens the fence when the content contains a backtick run', () => {
        // single backtick → use ``
        expect(inlineCode('a`b')).toBe('``a`b``');
    });

    it('pads with a space when the content starts or ends with backtick', () => {
        expect(inlineCode('`code')).toBe('`` `code ``');
        expect(inlineCode('code`')).toBe('`` code` ``');
    });

    it('widens the fence past the longest internal run', () => {
        expect(inlineCode('a``b')).toBe('```a``b```');
    });
});

describe('llm-md/format — collapseDescription', () => {
    it('returns empty string for missing input', () => {
        expect(collapseDescription(undefined)).toBe('');
    });

    it('strips simple HTML tags', () => {
        expect(collapseDescription('<p>Hello <strong>world</strong></p>')).toBe('Hello world');
    });

    it('decodes the common HTML entities', () => {
        expect(collapseDescription('&lt;Foo&gt; &amp; bar')).toBe('<Foo> & bar');
    });

    it('collapses newlines and multiple spaces to a single space', () => {
        expect(collapseDescription('foo\n  bar\nbaz   qux')).toBe('foo bar baz qux');
    });

    it('resolves {@link target} and {@link target|label} to plain text', () => {
        expect(collapseDescription('See {@link Foo} for details')).toBe('See Foo for details');
        expect(collapseDescription('See {@link Foo|FooBar} for details')).toBe(
            'See FooBar for details'
        );
    });
});

describe('llm-md/format — collapseSignatureWhitespace', () => {
    it('collapses every whitespace run to a single space', () => {
        expect(collapseSignatureWhitespace('foo\n   bar\tbaz')).toBe('foo bar baz');
    });

    it('coerces non-string inputs without throwing', () => {
        expect(collapseSignatureWhitespace(42)).toBe('42');
        expect(collapseSignatureWhitespace(null)).toBe('');
        expect(collapseSignatureWhitespace(undefined)).toBe('');
    });

    it('truncates above SIGNATURE_VALUE_CAP with an ellipsis', () => {
        const long = 'a'.repeat(SIGNATURE_VALUE_CAP + 50);
        const out = collapseSignatureWhitespace(long);
        expect(out.length).toBe(SIGNATURE_VALUE_CAP + 1);
        expect(out.endsWith('…')).toBe(true);
    });
});

describe('llm-md/format — formatPropertySignature', () => {
    it('renders just the name when no type and no default', () => {
        expect(formatPropertySignature('foo', undefined, false, undefined)).toBe('foo');
    });

    it('appends ? when optional', () => {
        expect(formatPropertySignature('foo', 'string', true, undefined)).toBe('foo?: string');
    });

    it('renders type and default value when present', () => {
        expect(formatPropertySignature('foo', 'number', false, '42')).toBe('foo: number = 42');
    });

    it('skips empty defaultValue', () => {
        expect(formatPropertySignature('foo', 'string', false, '')).toBe('foo: string');
    });
});

describe('llm-md/format — formatMethodSignature', () => {
    it('renders parens, args, and return type', () => {
        expect(formatMethodSignature('refresh', ['id: string'], 'void')).toBe(
            'refresh(id: string): void'
        );
    });

    it('omits the return type when not given', () => {
        expect(formatMethodSignature('foo', [], undefined)).toBe('foo()');
    });
});

describe('llm-md/format — deprecatedTail', () => {
    it('returns empty when not deprecated', () => {
        expect(deprecatedTail(false, 'use X')).toBe('');
        expect(deprecatedTail(undefined, 'msg')).toBe('');
    });

    it('shows just (deprecated) when no message', () => {
        expect(deprecatedTail(true, undefined)).toBe(' (deprecated)');
        expect(deprecatedTail(true, '')).toBe(' (deprecated)');
    });

    it('appends the collapsed message when present', () => {
        expect(deprecatedTail(true, 'use Foo instead')).toBe(' (deprecated: use Foo instead)');
    });
});

describe('llm-md/format — joinSections', () => {
    it('drops empty sections', () => {
        expect(joinSections(['a', '', 'b', ''])).toBe('a\n\nb');
    });

    it('returns an empty string for an all-empty input', () => {
        expect(joinSections(['', '', ''])).toBe('');
    });
});
