import ngdT from '@compodoc/ngd-transformer';
import DependenciesEngine from './dependencies.engine';
import FileEngine from './file.engine';

export class NgdEngine {
    public engine;

    private static instance: NgdEngine;
    private constructor() {}
    public static getInstance() {
        if (!NgdEngine.instance) {
            NgdEngine.instance = new NgdEngine();
        }
        return NgdEngine.instance;
    }

    public init(outputpath: string) {
        this.engine = new ngdT.DotEngine({
            output: outputpath,
            displayLegend: true,
            outputFormats: 'svg',
            silent: true
        });
    }

    public renderGraph(_filepath: string, outputpath: string, type: string, name?: string) {
        this.engine.updateOutput(outputpath);

        if (type === 'f') {
            return this.engine.generateGraph([DependenciesEngine.getRawModule(name)]);
        } else {
            return this.engine.generateGraph(DependenciesEngine.rawModulesForOverview);
        }
    }

    /**
     * Inject a <style> block into Graphviz-generated SVGs so that
     * external SVGs (loaded via <object>) also pick up theme colors.
     */
    private patchSvgStyles(svg: string): string {
        const styleBlock = `<style>
.graph > polygon { fill: var(--color-cdx-bg-alt, #f5f5f7); stroke: none; }
.node polygon { fill: var(--color-cdx-entity-module, #3b82f6); fill-opacity: 0.12; stroke: var(--color-cdx-entity-module, #3b82f6); stroke-opacity: 0.5; }
.node text, text { fill: var(--color-cdx-text, #1a1a2e); }
.edge path { stroke: var(--color-cdx-text-muted, #6b7280); }
.edge polygon { fill: var(--color-cdx-text-muted, #6b7280); stroke: var(--color-cdx-text-muted, #6b7280); }
.cluster > polygon, .cluster > path { stroke: var(--color-cdx-text-secondary, #5a6178); stroke-opacity: 0.6; }
</style>`;
        // Insert after opening <svg ...> tag
        return svg.replace(/(<svg[^>]*>)/, `$1\n${styleBlock}`);
    }

    public readGraph(filepath: string, name: string): Promise<string> {
        return FileEngine.get(filepath)
            .then(svg => {
                // Patch styles and write back to disk (for <object> embeds)
                const patched = this.patchSvgStyles(svg);
                return FileEngine.write(filepath, patched).then(() => patched);
            })
            .catch(_err => Promise.reject(`Error during graph read ${name}`));
    }
}

export default NgdEngine.getInstance();
