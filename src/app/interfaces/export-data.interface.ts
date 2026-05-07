import type { ThemeToken } from '../../utils/theme-doc-parser';
import type {
    HostDirectiveEntry,
    ProviderEntry
} from '../compiler/angular/deps/helpers/component-helper';
import type { JsdocTagInterface } from './jsdoc-tag.interface';
import type { RouteInterface } from './routes.interface';

export interface ExportArg {
    name: string;
    type?: string;
    optional?: boolean;
    dotDotDotToken?: boolean;
    deprecated?: boolean;
    deprecationMessage?: string;
    category?: string;
    description?: string;
    defaultValue?: string;
}

export interface ExportProperty {
    name: string;
    type?: string;
    defaultValue?: string;
    optional?: boolean;
    deprecated?: boolean;
    deprecationMessage?: string;
    category?: string;
    description?: string;
    rawdescription?: string;
    line?: number;
    modifierKind?: number[];
    decorators?: ReadonlyArray<unknown>;
    kind?: string;
    signalDeps?: string[];
    jsdoctags?: JsdocTagInterface[];
}

export interface ExportMethod {
    name: string;
    args?: ExportArg[];
    returnType?: string;
    typeParameters?: string[];
    optional?: boolean;
    line?: number;
    deprecated?: boolean;
    deprecationMessage?: string;
    category?: string;
    description?: string;
    rawdescription?: string;
    modifierKind?: number[];
    jsdoctags?: JsdocTagInterface[];
}

export interface ExportAccessor {
    name?: string;
    getSignature?: unknown;
    setSignature?: unknown;
}

export interface ExportSlot {
    name: string;
    description?: string;
}

export interface ExportHostBinding {
    name: string;
    args?: ExportArg[];
    argsType?: string;
    line?: number;
}

export interface ExportHostListener {
    name: string;
    args?: ExportArg[];
    argsDecorator?: string[];
    line?: number;
}

export interface ExportIndexSignature {
    id?: string;
    description?: string;
    args?: ExportArg[];
    returnType?: string;
}

/**
 * Single entry in the `children` array of an `ExportModule` —
 * the engine groups providers / declarations / imports / exports / bootstrap /
 * classes into typed buckets.
 */
export interface ExportModuleChildGroup {
    type: 'providers' | 'declarations' | 'imports' | 'exports' | 'bootstrap' | 'classes';
    elements: Array<{ name: string }>;
}

export interface ExportEntityCommon {
    id?: string;
    name: string;
    file?: string;
    type?: string;
    category?: string;
    description?: string;
    rawdescription?: string;
    sourceCode?: string;
    deprecated?: boolean;
    deprecationMessage?: string;
    extends?: string | string[];
    /** External documentation links injected by JSDoc tags. */
    storybookUrl?: string;
    figmaUrl?: string;
    stackblitzUrl?: string;
    githubUrl?: string;
    docsUrl?: string;
}

export interface ExportComponent extends ExportEntityCommon {
    selector?: string;
    standalone?: boolean;
    signal?: boolean;
    zoneless?: boolean;
    changeDetection?: string;
    encapsulation?: string[];
    preserveWhitespaces?: boolean;
    template?: string;
    templateUrl?: string[];
    styleUrls?: string[];
    styles?: string[];
    styleUrlsData?: string;
    stylesData?: string;
    assetsDirs?: string[];
    entryComponents?: string;
    exportAs?: string;
    inputs?: string[];
    outputs?: string[];
    imports?: ReadonlyArray<unknown>;
    providers?: ProviderEntry[];
    viewProviders?: ProviderEntry[];
    hostBindings?: ExportHostBinding[];
    hostListeners?: ExportHostListener[];
    hostStructured?: ReadonlyArray<unknown>;
    hostDirectives?: HostDirectiveEntry[];
    inputsClass?: ExportProperty[];
    outputsClass?: ExportProperty[];
    propertiesClass?: ExportProperty[];
    methodsClass?: ExportMethod[];
    accessors?: Record<string, ExportAccessor>;
    slots?: ExportSlot[];
    themeTokens?: ThemeToken[];
    themeStyleSources?: ReadonlyArray<unknown>;
    themeOverview?: string[];
    jsdoctags?: JsdocTagInterface[];
    route?: string;
    group?: string;
    order?: number;
    since?: string;
    beta?: boolean;
    breaking?: boolean;
}

export interface ExportDirective extends ExportEntityCommon {
    selector?: string;
    standalone?: boolean;
    signal?: boolean;
    zoneless?: boolean;
    inputsClass?: ExportProperty[];
    outputsClass?: ExportProperty[];
    propertiesClass?: ExportProperty[];
    methodsClass?: ExportMethod[];
    hostBindings?: ExportHostBinding[];
    hostListeners?: ExportHostListener[];
    hostStructured?: ReadonlyArray<unknown>;
    hostDirectives?: HostDirectiveEntry[];
    providers?: ProviderEntry[];
    jsdoctags?: JsdocTagInterface[];
    group?: string;
    since?: string;
    beta?: boolean;
    breaking?: boolean;
}

export interface ExportInjectable extends ExportEntityCommon {
    properties?: ExportProperty[];
    methods?: ExportMethod[];
    accessors?: Record<string, ExportAccessor>;
    constructorObj?: unknown;
    isToken?: boolean;
    tokenType?: string;
    providedIn?: string;
    jsdoctags?: JsdocTagInterface[];
}

export interface ExportInterceptor extends ExportEntityCommon {
    properties?: ExportProperty[];
    methods?: ExportMethod[];
    accessors?: Record<string, ExportAccessor>;
    constructorObj?: unknown;
    jsdoctags?: JsdocTagInterface[];
}

export interface ExportGuard extends ExportEntityCommon {
    properties?: ExportProperty[];
    methods?: ExportMethod[];
    accessors?: Record<string, ExportAccessor>;
    constructorObj?: unknown;
    jsdoctags?: JsdocTagInterface[];
    implements?: string[];
    indexSignatures?: ExportIndexSignature[];
    inputsClass?: ExportProperty[];
    outputsClass?: ExportProperty[];
    hostBindings?: ExportHostBinding[];
    hostListeners?: ExportHostListener[];
}

export interface ExportPipe extends ExportEntityCommon {
    standalone?: boolean;
    pure?: string;
    ngname?: string;
    methods?: ExportMethod[];
    properties?: ExportProperty[];
    readme?: string;
    jsdoctags?: JsdocTagInterface[];
}

export interface ExportClass extends ExportEntityCommon {
    properties?: ExportProperty[];
    methods?: ExportMethod[];
    accessors?: Record<string, ExportAccessor>;
    constructorObj?: unknown;
    indexSignatures?: ExportIndexSignature[];
    inputsClass?: ExportProperty[];
    outputsClass?: ExportProperty[];
    hostBindings?: ExportHostBinding[];
    hostListeners?: ExportHostListener[];
    jsdoctags?: JsdocTagInterface[];
}

export interface ExportInterface extends ExportEntityCommon {
    properties?: ExportProperty[];
    methods?: ExportMethod[];
    indexSignatures?: ExportIndexSignature[];
    kind?: number;
    jsdoctags?: JsdocTagInterface[];
}

export interface ExportFunction {
    name: string;
    file?: string;
    ctype?: string;
    subtype?: string;
    deprecated?: boolean;
    deprecationMessage?: string;
    category?: string;
    description?: string;
    factoryKind?: 'provider' | 'feature' | 'inject' | 'factory';
    returnType?: string;
    args?: ExportArg[];
    jsdoctags?: JsdocTagInterface[];
}

export interface ExportEnumMember {
    name: string;
    value?: string;
    deprecated?: boolean;
    deprecationMessage?: string;
}

export interface ExportEnumeration {
    name: string;
    file?: string;
    ctype?: string;
    subtype?: string;
    deprecated?: boolean;
    deprecationMessage?: string;
    category?: string;
    description?: string;
    childs?: ExportEnumMember[];
}

export interface ExportTypeAlias {
    name: string;
    file?: string;
    ctype?: string;
    subtype?: string;
    rawtype?: string;
    deprecated?: boolean;
    deprecationMessage?: string;
    category?: string;
    description?: string;
    kind?: number;
}

export interface ExportVariable {
    name: string;
    file?: string;
    ctype?: string;
    subtype?: string;
    deprecated?: boolean;
    deprecationMessage?: string;
    category?: string;
    type?: string;
    defaultValue?: string;
    description?: string;
}

/**
 * Items grouped by source folder. The engine emits these alongside the flat
 * `variables` / `functions` / `typealiases` / `enumerations` arrays.
 */
export interface ExportMiscellaneousGroup<T> {
    file: string;
    items: T[];
}

export interface ExportMiscellaneous {
    variables?: ExportVariable[];
    functions?: ExportFunction[];
    typealiases?: ExportTypeAlias[];
    enumerations?: ExportEnumeration[];
    groupedVariables?: ExportMiscellaneousGroup<ExportVariable>[];
    groupedFunctions?: ExportMiscellaneousGroup<ExportFunction>[];
    groupedEnumerations?: ExportMiscellaneousGroup<ExportEnumeration>[];
    groupedTypeAliases?: ExportMiscellaneousGroup<ExportTypeAlias>[];
}

export interface ExportModule {
    id?: string;
    name: string;
    file?: string;
    description?: string;
    rawDescription?: string;
    deprecated?: boolean;
    deprecationMessage?: string;
    methods?: ExportMethod[];
    sourceCode?: string;
    children: ExportModuleChildGroup[];
}

export interface ExportCoverageFile {
    filePath: string;
    type: string;
    linktype?: string;
    linksubtype?: string;
    name: string;
    coveragePercent: number;
    coverageCount: string;
    status: 'good' | 'low' | 'medium' | 'lowmedium' | 'verylow' | 'minimum-perfile-fail' | string;
}

export interface ExportCoverage {
    count?: number;
    status?: string;
    files?: ExportCoverageFile[];
}

/**
 * Top-level shape of `documentation.json`. This is the contract downstream
 * consumers (`compodocx diff`, `--export llm-md`, future VS Code extension)
 * import from `@cngxjs/compodocx`.
 */
export interface ExportData {
    pipes?: ExportPipe[];
    modules?: ExportModule[];
    interfaces?: ExportInterface[];
    injectables?: ExportInjectable[];
    guards?: ExportGuard[];
    interceptors?: ExportInterceptor[];
    classes?: ExportClass[];
    directives?: ExportDirective[];
    routes?: RouteInterface[];
    coverage?: ExportCoverage;
    miscellaneous?: ExportMiscellaneous;
    components?: ExportComponent[];
}
