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
        // Node builtins
        'child_process',
        'crypto',
        'fs',
        'http',
        'module',
        'os',
        'path',
        // npm dependencies (not bundled)
        '@babel/core',
        '@compodoc/live-server',
        '@compodoc/ngd-transformer',
        '@polka/send-type',
        'archiver',
        'body-parser',
        'cheerio',
        'chokidar',
        'commander',
        'cosmiconfig',
        'decache',
        'fancy-log',
        'fast-glob',
        'fs-extra',
        'handlebars',
        'html-entities',
        'i18next',
        'json5',
        'lunr',
        'marked',
        'minimist',
        'neotraverse/legacy',
        'os-name',
        'pdfmake',
        'picocolors',
        'polka',
        'semver',
        'sirv',
        'ts-morph',
        'typescript',
        'uuid'
    ]
};
