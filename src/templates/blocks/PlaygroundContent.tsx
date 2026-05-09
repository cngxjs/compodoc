import Html from '@kitajs/html';
import { renderCustomTemplate } from '../../app/engines/custom-template.engine';
import type { ConsumerPackageJson, DepGraphResolver } from '../../app/engines/stackblitz';
import type { ComponentPlaygroundBlock } from '../helpers/jsdoc';
import { BlockPlayground } from './BlockPlayground';

export type PlaygroundContentProps = {
    readonly componentName: string;
    readonly playgrounds: ComponentPlaygroundBlock[];
    readonly resolve?: DepGraphResolver;
    readonly workspacePackage?: ConsumerPackageJson;
};

/**
 * Renders one BlockPlayground per `@playground` block on the component. The
 * Playground tab calls this; tab visibility is gated upstream in
 * `getNavTabs()` so this component is only invoked when blocks exist.
 */
export function PlaygroundContent(props: PlaygroundContentProps): string {
    const blocks = props.playgrounds ?? [];
    const overrideArgs = {
        componentName: props.componentName,
        playgrounds: blocks
    };
    const custom = renderCustomTemplate('playground-content', overrideArgs);
    if (custom !== null) {
        return custom;
    }

    if (blocks.length === 0) {
        return '';
    }

    return (
        <div class="cdx-playground-stack">
            {blocks.map((block, index) =>
                BlockPlayground({
                    componentName: props.componentName,
                    block,
                    index,
                    resolve: props.resolve,
                    workspacePackage: props.workspacePackage
                })
            )}
        </div>
    ) as string;
}
