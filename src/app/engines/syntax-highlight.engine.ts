type ShikiTransformer = {
    line?: (this: unknown, hast: HastElement, line: number) => HastElement | undefined;
    postprocess?: (this: unknown, html: string, options: unknown) => string | undefined;
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

let THEME_LIGHT = 'github-light';
let THEME_DARK = 'github-dark';

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
    /** Entity index for cross-linking type names to their doc pages. */
    entityIndex?: Record<string, { href: string; kind: string }>;
}

/** Initialize the Shiki highlighter singleton. Call once before any highlight calls. */
export async function initHighlighter(shikiTheme?: string): Promise<void> {
    if (highlighter) {
        return;
    }

    if (shikiTheme) {
        const parts = shikiTheme.split(':');
        THEME_LIGHT = parts[0];
        THEME_DARK = parts.length > 1 ? parts[1] : parts[0];
    }

    const { createHighlighter, bundledThemes } = await import('shiki');
    const available = Object.keys(bundledThemes);
    if (!available.includes(THEME_LIGHT)) {
        const { logger } = await import('../../utils/logger');
        logger.warn(`Unknown Shiki theme '${THEME_LIGHT}', falling back to 'github-light'`);
        THEME_LIGHT = 'github-light';
    }
    if (!available.includes(THEME_DARK)) {
        const { logger } = await import('../../utils/logger');
        logger.warn(`Unknown Shiki theme '${THEME_DARK}', falling back to 'github-dark'`);
        THEME_DARK = 'github-dark';
    }

    highlighter = await createHighlighter({
        themes: [THEME_LIGHT, THEME_DARK],
        langs: SUPPORTED_LANGUAGES
    });
}

/**
 * Highlight source code and return an HTML string.
 * Falls back to escaped plain text if the highlighter is not initialized.
 */
export function highlightCode(code: string, optionsOrLang?: HighlightOptions | string): string {
    const opts: HighlightOptions =
        typeof optionsOrLang === 'string' ? { lang: optionsOrLang } : (optionsOrLang ?? {});

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

/** Detect foldable import blocks and decorator metadata blocks. */
export function detectFoldRegions(code: string): FoldRegion[] {
    const lines = code.split('\n');
    const regions: FoldRegion[] = [];

    let importStart = -1;
    let importEnd = -1;
    let importCount = 0;

    for (let i = 0; i < lines.length; i++) {
        const trimmed = lines[i].trim();
        if (trimmed.startsWith('import ') || trimmed.startsWith('import{')) {
            if (importStart === -1) {
                importStart = i;
            }
            importEnd = i;
            importCount++;
            if (!trimmed.includes(';') && !trimmed.endsWith("';") && !trimmed.endsWith('";')) {
                for (let j = i + 1; j < lines.length; j++) {
                    importEnd = j;
                    if (lines[j].includes(';')) {
                        break;
                    }
                }
            }
        } else if (
            importStart !== -1 &&
            trimmed !== '' &&
            !trimmed.startsWith('//') &&
            !trimmed.startsWith('/*') &&
            !trimmed.startsWith('*')
        ) {
            break;
        }
    }

    if (importCount >= 3) {
        regions.push({
            kind: 'imports',
            label: `${importCount} imports`,
            startLine: importStart + 1,
            endLine: importEnd + 1
        });
    }

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
                    if (ch === '{') {
                        braceDepth++;
                    }
                    if (ch === '}') {
                        braceDepth--;
                    }
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
    {
        pattern:
            /^\s*(?:public|private|protected|readonly|static|abstract|async|override|get|set)\s+(\w+)\s*[(:]/,
        kind: 'member'
    },
    { pattern: /^\s+(\w+)\s*\([^)]*\)\s*[:{]/, kind: 'method' },
    { pattern: /^\s+(?:readonly\s+)?(\w+)\s*[=:;]/, kind: 'property' }
];

/** Detect class members and type declarations. Line-by-line patterns, not a full parser. */
export function detectMembers(code: string): MemberInfo[] {
    const lines = code.split('\n');
    const members: MemberInfo[] = [];
    let currentClass = '';

    for (let i = 0; i < lines.length; i++) {
        for (const { pattern, kind } of MEMBER_PATTERNS) {
            const match = lines[i].match(pattern);
            if (match) {
                const name = match[1];
                if (
                    [
                        'if',
                        'for',
                        'while',
                        'switch',
                        'return',
                        'const',
                        'let',
                        'var',
                        'import',
                        'from',
                        'type'
                    ].includes(name)
                ) {
                    continue;
                }

                if (kind === 'class' || kind === 'interface' || kind === 'enum') {
                    currentClass = name;
                    members.push({ name, kind, line: i + 1 });
                } else if (currentClass) {
                    members.push({ name: `${currentClass}.${name}`, kind, line: i + 1 });
                }
                break;
            }
        }
    }

    return members;
}

// ---------------------------------------------------------------------------
// Shiki transformers
// ---------------------------------------------------------------------------

/** Shiki transformer: prepend line-number spans to each line. */
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

/** Shiki transformer: tag member-declaration lines for breadcrumb tracking. */
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

/** Shiki postprocessor: wrap fold regions in <details> elements. */
function foldRegionPostprocessor(regions: FoldRegion[]): ShikiTransformer {
    if (regions.length === 0) {
        return {};
    }

    return {
        postprocess(html: string) {
            let result = html;

            // reverse order so string offsets stay valid
            const sorted = [...regions].sort((a, b) => b.startLine - a.startLine);

            for (const region of sorted) {
                const startMarker = `data-cdx-line-nr="${region.startLine}"`;
                const nextLineMarker = `data-cdx-line-nr="${region.endLine + 1}"`;

                const startIdx = result.indexOf(startMarker);
                if (startIdx === -1) {
                    continue;
                }

                const tagStart = result.lastIndexOf('<span', startIdx);
                if (tagStart === -1) {
                    continue;
                }

                let lineEnd: number;
                const nextIdx = result.indexOf(nextLineMarker, startIdx);
                if (nextIdx !== -1) {
                    lineEnd = result.lastIndexOf('<span', nextIdx);
                    if (lineEnd === -1) {
                        continue;
                    }
                } else {
                    lineEnd = result.indexOf('</code>', startIdx);
                    if (lineEnd === -1) {
                        continue;
                    }
                }

                const detailsOpen = `<details class="cdx-fold-region" data-cdx-fold="${region.kind}"><summary class="cdx-fold-summary">${escapeHtml(region.label)}</summary>`;
                const detailsClose = '</details>';

                result =
                    result.slice(0, tagStart) +
                    detailsOpen +
                    result.slice(tagStart, lineEnd) +
                    detailsClose +
                    result.slice(lineEnd);
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
