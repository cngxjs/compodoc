import Html from '@kitajs/html';
import { resolveType } from '../helpers/link-type';
import { t } from '../helpers';

/**
 * Human-friendly labels for Angular decorator property names. Extend as needed.
 * Keys are the raw decorator property (the key used in the `@Component({...})` literal)
 * and values are the Title Case label that reads well in a docs table.
 */
const HUMAN_LABELS: Record<string, string> = {
    selector: 'Selector',
    standalone: 'Standalone',
    imports: 'Imports',
    providers: 'Providers',
    viewProviders: 'View providers',
    changeDetection: 'Change detection',
    encapsulation: 'Encapsulation',
    animations: 'Animations',
    exportAs: 'Export as',
    host: 'Host',
    hostDirectives: 'Host directives',
    interpolation: 'Interpolation',
    moduleId: 'Module ID',
    preserveWhitespaces: 'Preserve whitespaces',
    queries: 'Queries',
    entryComponents: 'Entry components',
    templateUrl: 'Template URL',
    styleUrl: 'Style URL',
    styleUrls: 'Style URLs',
    extends: 'Extends',
    implements: 'Implements',
    declarations: 'Declarations',
    exports: 'Exports',
    bootstrap: 'Bootstrap',
    schemas: 'Schemas',
    pure: 'Pure',
    name: 'Name',
    providedIn: 'Provided in',
    deps: 'Dependencies',
    tokenType: 'Token type',
    functionalKind: 'Kind',
    tag: 'Tag',
    shadow: 'Shadow',
    scoped: 'Scoped',
    assetsDir: 'Assets directory',
    assetsDirs: 'Assets directories'
};

/** Return a human-readable Title Case label for a decorator property key. */
export function humanLabel(key: string): string {
    if (HUMAN_LABELS[key]) {
        return HUMAN_LABELS[key];
    }
    // Fallback: split camelCase and title-case the first word
    const spaced = key.replace(/([a-z])([A-Z])/g, '$1 $2').toLowerCase();
    return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

/**
 * Build a resolved type payload used by `ChipList`. Tries the dep-engine first
 * so we can colour-code entity chips. Unresolved names fall back to a neutral
 * chip with no icon.
 */
function resolveChip(name: string): { href?: string; target?: string; type?: string } {
    const resolved = resolveType(name);
    if (!resolved) {
        return {};
    }
    // Angular framework entities always link to angular.dev
    if (resolved.href.startsWith('https://angular.dev')) {
        return { href: resolved.href, target: resolved.target, type: 'module' };
    }
    // Extract entity type from the href path: "../{typePath}s/Name.html"
    // where typePath is 'component', 'directive', ..., or 'classe' (for class → classes/)
    const m = resolved.href.match(/\.\.\/([a-z]+)\//);
    if (!m) {
        return { href: resolved.href, target: resolved.target };
    }
    const raw = m[1];
    // compodoc's URL conventions. 'miscellaneous' is the only folder that
    // doesn't follow the `{type}s/` plural rule.
    const URL_TYPE_MAP: Record<string, string> = {
        components: 'component',
        directives: 'directive',
        pipes: 'pipe',
        modules: 'module',
        classes: 'class',
        interfaces: 'interface',
        guards: 'guard',
        interceptors: 'interceptor',
        injectables: 'injectable',
        entities: 'entity',
        miscellaneous: 'miscellaneous'
    };
    const type = URL_TYPE_MAP[raw] ?? raw;
    return { href: resolved.href, target: resolved.target, type };
}

/** Single metadata row: `<dt>label</dt><dd>value</dd>` inside a `cdx-metadata-row`. */
export function MetadataRow(label: string, value: string, isBlock = false): string {
    return (
        <div class={`cdx-metadata-row${isBlock ? ' cdx-metadata-row--block' : ''}`}>
            <dt class="cdx-metadata-label">{humanLabel(label)}</dt>
            <dd class="cdx-metadata-value">{value}</dd>
        </div>
    ) as string;
}

/** Metadata row with value wrapped in `<code>`. */
export function MetadataCodeRow(label: string, value: string): string {
    return MetadataRow(label, `<code>${value}</code>`);
}

/**
 * Metadata row whose value is a list of entities rendered as clickable chips.
 * Each chip is colour-coded by entity type (from `--color-cdx-entity-*`).
 */
/**
 * Return true if `name` looks like a literal useValue primitive rather
 * than an entity identifier — e.g. `'2.0.0-admin'`, `"abc"`, `42`, `true`.
 * Compodoc's provider extractor sometimes passes useValue literals as
 * provider names; they should be filtered out of entity chip lists.
 */
function isLiteralPrimitive(name: string): boolean {
    const trimmed = name.trim();
    if (!trimmed) {
        return true;
    }
    // Quoted string literal
    if (
        (trimmed.startsWith("'") && trimmed.endsWith("'")) ||
        (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
        (trimmed.startsWith('`') && trimmed.endsWith('`'))
    ) {
        return true;
    }
    // Numeric / boolean / null / undefined literal
    if (/^-?\d+(\.\d+)?$/.test(trimmed)) {
        return true;
    }
    if (
        trimmed === 'true' ||
        trimmed === 'false' ||
        trimmed === 'null' ||
        trimmed === 'undefined'
    ) {
        return true;
    }
    return false;
}

type HostDirective = {
    readonly name: string;
    readonly inputs?: string[];
    readonly outputs?: string[];
};

const escapeHtml = (s: string): string =>
    s.replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[c] as string);

/**
 * Renders a metadata row for Angular host directives as code-style object
 * literals that mirror the original `@Component({ hostDirectives: [...] })`
 * source. Developers immediately recognise the shape because it's literally
 * what they wrote.
 *
 * Output looks like:
 *
 *     {
 *       directive: HighlightDirective,
 *       inputs: [color, hoverColor, enabled]
 *     }
 *     {
 *       directive: TooltipDirective
 *     }
 */
export function MetadataHostDirectivesRow(hostDirectives: HostDirective[]): string {
    if (!hostDirectives?.length) {
        return '';
    }

    const punct = (s: string) => `<span class="cdx-host-dir-punct">${s}</span>`;
    const key = (k: string) => `<span class="cdx-host-dir-key">${k}</span>`;
    const token = (t: string) => `<span class="cdx-host-dir-token">${escapeHtml(t)}</span>`;

    const renderNames = (names: string[]): string => names.map(n => token(n)).join(punct(', '));

    const items = hostDirectives.map(hd => {
        const resolved = resolveType(hd.name);
        const nameHtml = resolved
            ? `<a class="cdx-host-dir-name" href="${resolved.href}" target="${resolved.target}">${hd.name}</a>`
            : `<span class="cdx-host-dir-name">${hd.name}</span>`;

        const lines: string[] = [];
        lines.push(`  ${key('directive:')} ${nameHtml}`);
        if (hd.inputs?.length) {
            lines.push(`  ${key('inputs:')} ${punct('[')}${renderNames(hd.inputs)}${punct(']')}`);
        }
        if (hd.outputs?.length) {
            lines.push(`  ${key('outputs:')} ${punct('[')}${renderNames(hd.outputs)}${punct(']')}`);
        }

        const body = lines.join(`${punct(',')}\n`);
        return `<div class="cdx-host-dir-object">${punct('{')}\n${body}\n${punct('}')}</div>`;
    });

    return MetadataRow(
        'hostDirectives',
        `<div class="cdx-host-dir-list">${items.join('')}</div>`
    );
}

export function MetadataChipsRow(label: string, names: Array<string | { name: string }>): string {
    const items = names
        .map(n => (typeof n === 'string' ? n : n.name))
        .filter(Boolean)
        .filter(n => !isLiteralPrimitive(n));
    if (items.length === 0) {
        return '';
    }
    const chips = items.map(name => {
        const chip = resolveChip(name);
        const kindClass = chip.type ? ` cdx-chip--${chip.type}` : '';
        if (chip.href) {
            return `<a class="cdx-chip${kindClass}" href="${chip.href}" target="${chip.target}">${name}</a>`;
        }
        return `<span class="cdx-chip${kindClass}">${name}</span>`;
    });
    return MetadataRow(label, `<div class="cdx-chip-list">${chips.join('')}</div>`);
}

/** Full metadata section: `<section>` + `<h3>` + `<dl>` wrapping pre-rendered rows. */
export function MetadataSection(props: {
    readonly title?: string;
    readonly rows: string[];
}): string {
    const rows = props.rows.filter(r => !!r);
    if (rows.length === 0) {
        return '';
    }
    return (
        <section class="cdx-content-section" data-compodoc="block-metadata">
            <h3 class="cdx-section-heading">{props.title ?? t('metadata')}</h3>
            <dl class="cdx-metadata-card">{rows.join('')}</dl>
        </section>
    ) as string;
}
