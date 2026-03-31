import typescript from '@rollup/plugin-typescript';
import json from '@rollup/plugin-json';

export default {
    input: {
        'index-cli': './src/index-cli.ts',
        index: './src/index.ts',
        'template-playground-server': './src/template-playground/template-playground-server.ts'
    },
    output: {
        sourcemap: 'inline',
        format: 'cjs',
        dir: 'dist'
    },
    plugins: [
        json(),
        typescript()
    ],
    external: [
        'handlebars',
        'marked',
        'path',
        'util',
        'fs-extra',
        '@compodoc/live-server',
        'typescript',
        'highlight.js',
        'semver',
        'json5',
        'ts-simple-ast',
        'i18next',
        'loglevel',
        'ts-morph',
        'cosmiconfig',
        'html-entities',
        'uuid',
        'crypto',
        'child_process',
        'os',
        'http',
        'archiver'
    ]
};
