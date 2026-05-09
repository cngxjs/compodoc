export const LEGACY_PACKAGE_NAME = '@compodoc/compodoc';

export const LEGACY_BIN_PATTERN = /\bcompodoc(?!x)\b/g;

export const LEGACY_SCRIPT_KEY_PREFIX = 'compodoc:';

export const DEFAULT_SCRIPT_PREFIX = 'compodocx';

export const SCRIPT_PREFIX_PATTERN = /^[a-z][a-z0-9-]*$/;

export const TSCONFIG_DOC_TEMPLATE = {
    include: ['src/**/*.ts'],
    exclude: ['src/**/*.spec.ts']
};

export interface ScriptValueContext {
    prefix: string;
    tsconfigPath: string;
}

export const SCRIPT_VALUE_TEMPLATES: {
    build: (ctx: ScriptValueContext) => string;
    'build-and-serve': (ctx: ScriptValueContext) => string;
    serve: (ctx: ScriptValueContext) => string;
} = {
    build: ({ prefix, tsconfigPath }) => `${prefix} -p ${tsconfigPath}`,
    'build-and-serve': ({ prefix, tsconfigPath }) => `${prefix} -p ${tsconfigPath} -s`,
    serve: ({ prefix }) => `${prefix} -s`
};

export type GeneratedScriptKey = 'build' | 'build-and-serve' | 'serve';

export const GENERATED_SCRIPT_KEYS: readonly GeneratedScriptKey[] = [
    'build',
    'build-and-serve',
    'serve'
] as const;
