import type { FileRefBundle } from '../engines/stackblitz';
import type { CoverageData } from './coverageData.interface';

export interface MainDataInterface {
    output: string;
    theme: string;
    extTheme: string;
    customThemePath: string;
    shikiTheme: string;
    serve: boolean;
    hostname: string;
    host: string;
    port: number;
    open: boolean;
    assetsFolder: string;
    documentationMainName: string;
    documentationMainDescription: string;
    base: string;
    hideGenerator: boolean;
    hideDarkModeToggle: boolean;
    hasFilesToCoverage: boolean;
    modules: any;
    readme: boolean;
    readmeAiGenerated?: string | true;
    changelog: string;
    contributing: string;
    license: string;
    todo: string;
    markdowns: any[];
    additionalPages: any;
    pipes: any;
    classes: any;
    interfaces: any;
    components: any;
    entities: any;
    directives: any;
    injectables: any;
    interceptors: any;
    guards: any;
    miscellaneous: any;
    routes: any;
    tsconfig: string;
    toggleMenuItems: string[];
    navTabConfig: any[];
    templates: string;
    includes: string;
    includesName: string;
    includesFolder: string;
    disableSourceCode: boolean;
    disableDomTree: boolean;
    disableTemplateTab: boolean;
    disableStyleTab: boolean;
    disableGraph: boolean;
    disableMainGraph: boolean;
    disableCoverage: boolean;
    disablePrivate: boolean;
    disableProtected: boolean;
    disableInternal: boolean;
    disableLifeCycleHooks: boolean;
    disableConstructors: boolean;
    disableRoutesGraph: boolean;
    disableSearch: boolean;
    disableDependencies: boolean;
    disableDependenciesTab: boolean;
    /**
     * When true, suppresses the Playground tab on component pages even if
     * `@playground` blocks were parsed. Default false. Independent of
     * `disableDependenciesTab` — that flag only controls the dependency graph.
     */
    disablePlaygroundTab: boolean;
    disableProperties: boolean;
    disableFilePath: boolean;
    disableOverview: boolean;
    showEffects: boolean;
    watch: boolean;
    mainGraph: string;
    dependencyGraph: {
        nodes: Array<{ name: string; type: string; url?: string }>;
        edges: Array<{ source: string; target: string }>;
    };
    entityIndex: Record<string, { href: string; kind: string }>;
    coverageTest: boolean;
    coverageTestThreshold: number;
    coverageTestThresholdFail: boolean;
    coverageTestPerFile: boolean;
    coverageMinimumPerFile: number;
    coverageTestShowOnlyFailed: boolean;
    unitTestCoverage: string;
    unitTestData: Object;
    routesLength: number;
    angularVersion: string;
    exportFormat: string;
    /** Indent size (0–8) for `--exportFormat json`. 0 = single-line. */
    jsonIndent: number;
    /**
     * When true, output is written to `<output>/<versionLabel>/`, a
     * `versions.json` manifest is maintained at `versionsRoot`, and the
     * topbar version-switcher widget is rendered. Default true. Pass
     * `--no-multiVersion` to restore the pre-v0.3.0 flat output layout.
     */
    multiVersion: boolean;
    /** Resolved version label used as the version subfolder name. */
    versionLabel: string;
    /** Folder containing `versions.json`. Defaults to the parent of `output`. */
    versionsRoot: string;
    /** Switcher dropdown cap. `0` is unlimited. */
    maxVersionsShown: number;
    /**
     * True when the user explicitly passed `-d` / `--output` on the CLI or in
     * a config file. Used by `--exportFormat llm-md` to decide between writing
     * to a file (`<output>/llm-context.md`) and streaming to stdout.
     */
    outputProvided: boolean;
    coverageData: CoverageData;
    customFavicon: string;
    customLogo: string;
    packageDependencies: Object[];
    packagePeerDependencies: Object[];
    packageProperties: any;
    gaID: string;
    angularProject: boolean;
    language: string;
    maxSearchResults: number;
    publicApiOnly: string;
    publicApiExports: Map<string, Set<string>>;
    infoTabSections: string[];
    apiTabSections: string[];
    themingTabSections: string[];
    stackblitz: boolean;
    stackblitzTemplate: string;
    /**
     * Subset of the consumer's `package.json` (`dependencies` +
     * `peerDependencies`) used to pin third-party deps in `@playground`
     * StackBlitz manifests. Set in `application.ts` after the workspace
     * `package.json` is loaded; left as `{}` when no manifest is reachable.
     */
    workspacePackage: {
        dependencies?: Record<string, string>;
        peerDependencies?: Record<string, string>;
    };
    /**
     * Config-only override map for `@playground` manifests. Wins over the
     * consumer-`package.json` auto-forward — use it for libraries the
     * consumer hosts but doesn't `npm install` directly (peer-only CSS
     * themes, dev-time-only deps), or to pin a specific version per build.
     * No CLI flag — this surfaces only via `compodocx.config.json`.
     */
    playgroundDependencies: Record<string, string>;
    /**
     * Resolved file-ref bundles per playground block. Key format:
     * `${componentName}:${blockIndex}`. Populated in `application.ts` after
     * the dep-graph build by walking every component/directive/etc with at
     * least one `@playground` block carrying `fileRef`. Failed reads warn via
     * `logger.warn` and the entry is skipped — the manifest builder then
     * surfaces a "Project assembly failed" fallback for that block.
     */
    playgroundFiles: Record<string, FileRefBundle>;
    appConfig: any[];
    categorizedComponents: Record<string, unknown[]>;
    categorizedDirectives: Record<string, unknown[]>;
    categorizedInjectables: Record<string, unknown[]>;
    categorizedPipes: Record<string, unknown[]>;
    categorizedClasses: Record<string, unknown[]>;
    categorizedInterfaces: Record<string, unknown[]>;
    categorizedGuards: Record<string, unknown[]>;
    categorizedInterceptors: Record<string, unknown[]>;
    categorizedEntities: Record<string, unknown[]>;
    categorizedByFeature: Record<string, unknown[]>;
    categorizedByFeaturePrimary: Record<string, unknown[]>;
    categorizedByFeatureReference: Record<string, unknown[]>;
    groupBy: 'folder' | 'category' | 'none' | '';
    groupDepth: number;
    menuLayout: 'type' | 'feature';
    featuresName: string;
    referencesName: string;
    collapsedAll: boolean;
    generatedAt: string;
}
