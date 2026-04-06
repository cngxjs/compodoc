type ShikiTransformer = {
    line?: (this: unknown, hast: HastElement, line: number) => HastElement | void;
    postprocess?: (this: unknown, html: string, options: unknown) => string | void;
};

type HastElement = {
    type: string;
    tagName: string;
    properties: Record<string, unknown>;
    children: HastNode[];
};

type HastText = {
    type: 'text';
    value: string;
};

type HastNode = HastElement | HastText;

type Highlighter = {
    codeToHtml(code: string, options: unknown): string;
};

let highlighter: Highlighter | null = null;

const THEME_LIGHT = 'github-light';
const THEME_DARK = 'github-dark';

const SUPPORTED_LANGUAGES = [
    'typescript',
    'javascript',
    'html',
    'css',
    'scss',
    'json',
    'bash',
    'markdown'
];

export interface FoldRegion {
    kind: 'imports' | 'decorator';
    label: string;
    startLine: number;
    endLine: number;
}

export interface MemberInfo {
    name: string;
    kind: string;
    line: number;
}

export interface HighlightOptions {
    /** Language for syntax highlighting. Defaults to 'typescript'. */
    lang?: string;
    /** 'source' adds line numbers + data attributes; 'snippet' is compact. */
    mode?: 'source' | 'snippet';
    /** Entity index for type reference linking. When provided, type names matching known entities get data-entity spans. */
    entityIndex?: Record<string, { href: string; kind: string }>;
}

/**
 * Initialize the Shiki highlighter singleton.
 * Must be called once before any highlight calls (async because Shiki loads WASM).
 * Uses dynamic import() to avoid ESM/CJS warnings.
 */
export async function initHighlighter(): Promise<void> {
    if (highlighter) return;
    const { createHighlighter } = await import('shiki');
    highlighter = await createHighlighter({
        themes: [THEME_LIGHT, THEME_DARK],
        langs: SUPPORTED_LANGUAGES
    });
}

/**
 * Highlight source code and return an HTML string.
 * Falls back to escaped plain text if the highlighter is not initialized.
 *
 * When mode is 'source', adds line numbers, fold regions, and member markers.
 * When mode is 'snippet' (default), renders compact without line numbers.
 */
export function highlightCode(code: string, optionsOrLang?: HighlightOptions | string): string {
    const opts: HighlightOptions = typeof optionsOrLang === 'string'
        ? { lang: optionsOrLang }
        : optionsOrLang ?? {};

    const lang = opts.lang ?? 'typescript';
    const mode = opts.mode ?? 'snippet';

    if (!highlighter) {
        return escapeHtml(code);
    }

    const resolvedLang = SUPPORTED_LANGUAGES.includes(lang) ? lang : 'typescript';

    const transformers: ShikiTransformer[] = [];
    let foldRegions: FoldRegion[] = [];
    let members: MemberInfo[] = [];

    if (mode === 'source') {
        foldRegions = detectFoldRegions(code);
        members = detectMembers(code);
        transformers.push(lineNumberTransformer());
        transformers.push(memberMarkerTransformer(members));
        transformers.push(foldRegionPostprocessor(foldRegions));
    }

    return highlighter.codeToHtml(code, {
        lang: resolvedLang,
        themes: {
            light: THEME_LIGHT,
            dark: THEME_DARK
        },
        transformers
    });
}

// ---------------------------------------------------------------------------
// Fold region detection (text scanning, no AST required)
// ---------------------------------------------------------------------------

/**
 * Detect foldable regions in TypeScript/JavaScript source code.
 * Returns import blocks and decorator metadata blocks.
 */
export function detectFoldRegions(code: string): FoldRegion[] {
    const lines = code.split('\n');
    const regions: FoldRegion[] = [];

    // --- Imports block ---
    let importStart = -1;
    let importEnd = -1;
    let importCount = 0;

    for (let i = 0; i < lines.length; i++) {
        const trimmed = lines[i].trim();
        if (trimmed.startsWith('import ') || trimmed.startsWith('import{')) {
            if (importStart === -1) importStart = i;
            importEnd = i;
            importCount++;
            // Handle multi-line imports
            if (!trimmed.includes(';') && !trimmed.endsWith("';") && !trimmed.endsWith('";')) {
                for (let j = i + 1; j < lines.length; j++) {
                    importEnd = j;
                    if (lines[j].includes(';')) break;
                }
            }
        } else if (importStart !== -1 && trimmed !== '' && !trimmed.startsWith('//') && !trimmed.startsWith('/*') && !trimmed.startsWith('*')) {
            break; // End of imports block (non-empty, non-comment line)
        }
    }

    if (importCount >= 3) {
        regions.push({
            kind: 'imports',
            label: `${importCount} imports`,
            startLine: importStart + 1, // 1-based
            endLine: importEnd + 1
        });
    }

    // --- Decorator blocks ---
    const decoratorPattern = /^@(Component|Directive|NgModule|Injectable|Pipe)\s*\(\s*\{/;
    for (let i = 0; i < lines.length; i++) {
        const trimmed = lines[i].trim();
        const match = trimmed.match(decoratorPattern);
        if (match) {
            const decoratorName = match[1];
            let braceDepth = 0;
            let endIdx = i;

            for (let j = i; j < lines.length; j++) {
                for (const ch of lines[j]) {
                    if (ch === '{') braceDepth++;
                    if (ch === '}') braceDepth--;
                }
                if (braceDepth <= 0) {
                    endIdx = j;
                    break;
                }
            }

            const lineSpan = endIdx - i + 1;
            if (lineSpan >= 3) {
                regions.push({
                    kind: 'decorator',
                    label: `@${decoratorName} metadata`,
                    startLine: i + 1,
                    endLine: endIdx + 1
                });
            }
        }
    }

    return regions;
}

// ---------------------------------------------------------------------------
// Member detection (text scanning for breadcrumb data)
// ---------------------------------------------------------------------------

const MEMBER_PATTERNS: Array<{ pattern: RegExp; kind: string }> = [
    { pattern: /^\s*(?:export\s+)?(?:abstract\s+)?class\s+(\w+)/, kind: 'class' },
    { pattern: /^\s*(?:export\s+)?(?:abstract\s+)?interface\s+(\w+)/, kind: 'interface' },
    { pattern: /^\s*(?:export\s+)?enum\s+(\w+)/, kind: 'enum' },
    { pattern: /^\s*(?:public|private|protected|readonly|static|abstract|async|override|get|set)\s+(\w+)\s*[\(:]/, kind: 'member' },
    { pattern: /^\s+(\w+)\s*\([^)]*\)\s*[:{]/, kind: 'method' },
    { pattern: /^\s+(?:readonly\s+)?(\w+)\s*[=:;]/, kind: 'property' },
];

/**
 * Detect class members and type declarations for breadcrumb navigation.
 * Simple line-by-line pattern matching — intentionally not a full parser.
 */
export function detectMembers(code: string): MemberInfo[] {
    const lines = code.split('\n');
    const members: MemberInfo[] = [];
    let currentClass = '';

    for (let i = 0; i < lines.length; i++) {
        for (const { pattern, kind } of MEMBER_PATTERNS) {
            const match = lines[i].match(pattern);
            if (match) {
                const name = match[1];
                // Skip common noise
                if (['if', 'for', 'while', 'switch', 'return', 'const', 'let', 'var', 'import', 'from', 'type'].includes(name)) continue;

                if (kind === 'class' || kind === 'interface' || kind === 'enum') {
                    currentClass = name;
                    members.push({ name, kind, line: i + 1 });
                } else if (currentClass) {
                    members.push({ name: `${currentClass}.${name}`, kind, line: i + 1 });
                }
                break; // First match wins per line
            }
        }
    }

    return members;
}

// ---------------------------------------------------------------------------
// Shiki transformers
// ---------------------------------------------------------------------------

/**
 * Adds line number spans and data-cdx-line-nr to each line.
 */
function lineNumberTransformer(): ShikiTransformer {
    return {
        line(hast: HastElement, line: number) {
            hast.properties['data-cdx-line-nr'] = line;

            const lineNumSpan: HastElement = {
                type: 'element',
                tagName: 'span',
                properties: {
                    class: 'cdx-line-number',
                    'data-cdx-line-nr': line,
                    'aria-hidden': 'true'
                },
                children: [{ type: 'text', value: String(line) }]
            };

            hast.children = [lineNumSpan as unknown as HastNode, ...hast.children];
        }
    };
}

/**
 * Adds data-cdx-member attributes on lines where members are declared.
 * Used by the client-side breadcrumb bar.
 */
function memberMarkerTransformer(members: MemberInfo[]): ShikiTransformer {
    const memberByLine = new Map(members.map(m => [m.line, m]));

    return {
        line(hast: HastElement, line: number) {
            const member = memberByLine.get(line);
            if (member) {
                hast.properties['data-cdx-member'] = member.name;
                hast.properties['data-cdx-member-kind'] = member.kind;
            }
        }
    };
}

/**
 * Post-processes the Shiki HTML output to wrap fold regions in <details> elements.
 * Uses the next line's marker (or </code>) to find the boundary of each region.
 */
function foldRegionPostprocessor(regions: FoldRegion[]): ShikiTransformer {
    if (regions.length === 0) return {};

    return {
        postprocess(html: string) {
            let result = html;

            // Process regions in reverse order so string offsets don't shift
            const sorted = [...regions].sort((a, b) => b.startLine - a.startLine);

            for (const region of sorted) {
                const startMarker = `data-cdx-line-nr="${region.startLine}"`;
                const nextLineMarker = `data-cdx-line-nr="${region.endLine + 1}"`;

                const startIdx = result.indexOf(startMarker);
                if (startIdx === -1) continue;

                // Find the <span that contains the start line attribute
                const tagStart = result.lastIndexOf('<span', startIdx);
                if (tagStart === -1) continue;

                // Find the start of the NEXT line after the region (or end of code block)
                let lineEnd: number;
                const nextIdx = result.indexOf(nextLineMarker, startIdx);
                if (nextIdx !== -1) {
                    // Find the <span that starts the next line
                    lineEnd = result.lastIndexOf('<span', nextIdx);
                    if (lineEnd === -1) continue;
                } else {
                    // No next line -- region goes to end of code block
                    lineEnd = result.indexOf('</code>', startIdx);
                    if (lineEnd === -1) continue;
                }

                const detailsOpen = `<details class="cdx-fold-region" data-cdx-fold="${region.kind}"><summary class="cdx-fold-summary">${escapeHtml(region.label)}</summary>`;
                const detailsClose = '</details>';

                result = result.slice(0, tagStart) + detailsOpen + result.slice(tagStart, lineEnd) + detailsClose + result.slice(lineEnd);
            }

            return result;
        }
    };
}

function escapeHtml(str: string): string {
    return str
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;');
}
