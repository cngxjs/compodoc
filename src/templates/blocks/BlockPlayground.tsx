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
    readonly block: ComponentPlaygroundBlock;
    readonly index: number;
    readonly resolve?: DepGraphResolver;
    readonly workspacePackage?: ConsumerPackageJson;
};

const buildFallbackResolver =
    (componentName: string): DepGraphResolver =>
    (name: string): DepGraphNode | null =>
        name === componentName
            ? {
                  name,
                  file: `src/app/${slugifyId(name)}.component.ts`,
                  sourceCode:
                      "// Source not available — open the component's Source tab on the doc page.",
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

    const resolve = props.resolve ?? buildFallbackResolver(props.componentName);
    const built = buildPlaygroundManifest(
        props.componentName,
        props.block,
        resolve,
        props.workspacePackage
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
    const manifestJson = (Html.escapeHtml(JSON.stringify(manifest)) as string).replaceAll(
        '</',
        '<\\/'
    );

    return (
        <section class="cdx-content-section" data-compodoc="block-playground" id={blockId}>
            <h3 class="cdx-section-heading" id={titleId}>
                {props.block.title}
            </h3>
            <div class="cdx-playground-snippet">{highlighted}</div>
            <button
                type="button"
                class="cdx-playground-launch"
                data-cdx-stackblitz-manifest={blockId}
                aria-describedby={titleId}
            >
                Open in StackBlitz
            </button>
            <script
                type="application/json"
                data-cdx-stackblitz-manifest-data={blockId}
            >{`${manifestJson}`}</script>
        </section>
    ) as string;
}
