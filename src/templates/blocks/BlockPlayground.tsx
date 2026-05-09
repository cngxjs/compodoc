import Html from '@kitajs/html';
import { renderCustomTemplate } from '../../app/engines/custom-template.engine';
import {
    buildPlaygroundManifest,
    type ConsumerPackageJson,
    type DepGraphNode,
    type DepGraphResolver
} from '../../app/engines/stackblitz';
import { highlightCode } from '../../app/engines/syntax-highlight.engine';
import { logger } from '../../utils/logger';
import type { ComponentPlaygroundBlock } from '../helpers/jsdoc';

const slugifyId = (raw: string): string =>
    raw
        .toLowerCase()
        .replaceAll(/[^a-z0-9]+/g, '-')
        .replaceAll(/^-+|-+$/g, '');

export type BlockPlaygroundProps = {
    readonly componentName: string;
    /** Real on-disk path of the component file. Drives the manifest import. */
    readonly componentFile?: string;
    /** Full source of the component file. Inlined into the StackBlitz project. */
    readonly componentSourceCode?: string;
    readonly block: ComponentPlaygroundBlock;
    readonly index: number;
    readonly resolve?: DepGraphResolver;
    readonly workspacePackage?: ConsumerPackageJson;
    /** Config-file `playgroundDependencies` — wins over consumer-pkg auto-forward. */
    readonly extraDependencies?: Record<string, string>;
};

const buildFallbackResolver =
    (componentName: string, file?: string, sourceCode?: string): DepGraphResolver =>
    (name: string): DepGraphNode | null =>
        name === componentName
            ? {
                  name,
                  file: file && file.length > 0 ? file : `src/app/${slugifyId(name)}.component.ts`,
                  sourceCode:
                      sourceCode && sourceCode.length > 0
                          ? sourceCode
                          : "// Source not available — open the component's Source tab on the doc page.",
                  imports: []
              }
            : null;

export function BlockPlayground(props: BlockPlaygroundProps): string {
    const overrideArgs = {
        componentName: props.componentName,
        block: props.block,
        index: props.index
    };
    const custom = renderCustomTemplate('block-playground', overrideArgs);
    if (custom !== null) {
        return custom;
    }

    const resolve =
        props.resolve ??
        buildFallbackResolver(props.componentName, props.componentFile, props.componentSourceCode);
    const built = buildPlaygroundManifest(
        props.componentName,
        props.block,
        resolve,
        props.workspacePackage,
        props.extraDependencies ? { extraDependencies: props.extraDependencies } : undefined
    );

    const blockId = `playground-${slugifyId(props.componentName)}-${props.index}`;
    const titleId = `${blockId}-title`;

    if (!built.ok) {
        logger.warn(
            `Playground "${props.block.title}" on ${props.componentName} could not be assembled: ${built.error}`
        );
        return (
            <section
                class="cdx-content-section"
                data-compodoc="block-playground"
                data-cdx-playground-status="failed"
            >
                <h3 class="cdx-section-heading" id={titleId}>
                    {props.block.title}
                </h3>
                <p class="cdx-playground-fallback">
                    {`Project assembly failed for "${props.block.title}". Open the component's Source tab to view the snippet directly.`}
                </p>
            </section>
        ) as string;
    }

    const manifest = built.value;
    const highlighted = highlightCode(props.block.snippet, {
        lang: props.block.language,
        mode: 'snippet'
    });
    // <script> is parsed in raw-text mode in HTML5 — entities are NOT decoded
    // by the parser, so HTML-escaping the JSON would break JSON.parse on the
    // client. We only need to escape `</` to prevent premature script close.
    const manifestJson = JSON.stringify(manifest).replaceAll('</', '<\\/');

    // Raw <script> tag bypasses kitajs/html child-escaping. Entities inside
    // <script> are not decoded by the HTML5 parser, so escaping the JSON would
    // break JSON.parse on the client side.
    const manifestScript =
        `<script type="application/json" data-cdx-stackblitz-manifest-data="${blockId}">` +
        `${manifestJson}</script>`;
    const escapedTitle = Html.escapeHtml(props.block.title) as string;

    // StackBlitz brand glyph (lightning bolt). Inline SVG so it inherits the
    // button's `currentColor` and ships zero extra requests.
    const stackblitzIcon =
        '<svg viewBox="0 0 28 28" fill="currentColor" aria-hidden="true">' +
        '<path d="M11.65 16.85H5.62l11.13-13.4-2.4 10.7h6.03L9.25 27.55l2.4-10.7Z" />' +
        '</svg>';

    return (
        `<section class="cdx-content-section" data-compodoc="block-playground" id="${blockId}">` +
        `<h3 class="cdx-section-heading" id="${titleId}">${escapedTitle}</h3>` +
        `<div class="cdx-playground-snippet">${highlighted}</div>` +
        `<button type="button" class="cdx-playground-launch" data-cdx-stackblitz-manifest="${blockId}" aria-describedby="${titleId}">` +
        `${stackblitzIcon}<span>Open in StackBlitz</span>` +
        `</button>` +
        manifestScript +
        `</section>`
    );
}
