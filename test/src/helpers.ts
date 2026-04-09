//import * as PDFJS from 'pdfjs-dist/legacy/build/pdf.mjs';

import { readFileSync } from 'node:fs';
import path, { resolve } from 'node:path';
import fs from 'fs-extra';

// JSON import with correct path from test/src/ (not test/dist/test/src/)
const pkg = JSON.parse(readFileSync(resolve(__dirname, '../../package.json'), 'utf-8'));

export { fs, path, pkg };

/**
 * Checks if stderr contains a real error (not just ANSI codes/whitespace from fancy-log).
 * fancy-log writes all output to stderr, so normal info/debug messages appear there.
 */
export function hasStderrError(stderr: string): boolean {
    // Filter out Node.js ExperimentalWarning (from ESM-only deps loaded via require() in CJS dist)
    const stripped = stderr
        .replaceAll(/\x1b\[[0-9;]*m/g, '')
        .split('\n')
        .filter(line => {
            const trimmed = line.trim();
            if (!trimmed) {
                return false;
            }
            if (trimmed.includes('ExperimentalWarning')) {
                return false;
            }
            if (trimmed.startsWith('Support for loading ES Module')) {
                return false;
            }
            if (trimmed.startsWith('(Use `node --trace-warnings')) {
                return false;
            }
            return true;
        })
        .join('\n')
        .trim();
    return stripped.length > 0;
}

export function read(file: string, encoding = null): string {
    return fs.readFileSync(file, encoding).toString();
}

export function exists(file: string): boolean {
    return fs.existsSync(file);
}

export function stats(file: string): object {
    return fs.statSync(file);
}

export function remove(file: string): any {
    return fs.removeSync(file);
}

export function copy(source: string, dest: string): any {
    return fs.copySync(source, dest);
}

export function temporaryDir() {
    let name = '.tmp-compodocx-test';
    const cleanUp = cleanUpName => {
        if (fs.existsSync(cleanUpName)) {
            fs.readdirSync(cleanUpName).forEach(file => {
                const curdir = path.join(cleanUpName, file);
                if (fs.statSync(curdir).isDirectory()) {
                    cleanUp(curdir);
                } else {
                    fs.unlinkSync(curdir);
                }
            });
            fs.rmdirSync(cleanUpName);
        }
    };

    return {
        name,
        remove: remove,
        copy(source, destination) {
            fs.copySync(source, destination);
        },
        create(param?) {
            if (param) {
                name = param;
            }
            if (!fs.existsSync(name)) {
                fs.mkdirSync(name);
            }
        },
        clean(param?) {
            if (param) {
                name = param;
            }
            try {
                cleanUp(name);
            } catch (e) {}
        }
    };
}

export {
    exec,
    spawn as shellAsync,
    spawn,
    spawnSync as shell
} from 'node:child_process';
