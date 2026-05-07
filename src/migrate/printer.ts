/**
 * Console formatting for the migrate CLI.
 *
 * Mirrors the visual rhythm of the main compodocx logger
 * (`src/utils/logger.ts`):
 *   - gray `[HH:MM:SS]` timestamp prefix on every line
 *   - level-coloured tag (green / yellow / red) via picocolors
 *   - 15-char right-padded `key            : value` for detail lines
 *
 * Pure functions: every printer here returns a string. `printLine` is the
 * only side-effecting helper (writes to stdout).
 */

import c from 'picocolors';
import type { FidelityScore } from './types';

const KEY_PAD = 15;

const timestamp = (): string => c.gray(`[${new Date().toLocaleTimeString()}]`);

const padRight = (s: string, len: number = KEY_PAD): string =>
    s + ' '.repeat(Math.max(0, len - s.length));

export const tagFor = (score: FidelityScore): string => {
    switch (score) {
        case 'green':
            return c.green('[OK]  ');
        case 'yellow':
            return c.yellow('[WARN]');
        case 'red':
            return c.red('[ERR] ');
    }
};

export const tagForSeverity = (severity: 'info' | 'warning' | 'error'): string => {
    switch (severity) {
        case 'info':
            return c.green('[OK]  ');
        case 'warning':
            return c.yellow('[WARN]');
        case 'error':
            return c.red('[ERR] ');
    }
};

/** Top-level result line: `[14:23:01] [OK]   <message>`. */
export const printLine = (parts: string): void => {
    process.stdout.write(`${timestamp()} ${parts}\n`);
};

/** Indented detail line: `[14:23:01]        key            : value`. */
export const printDetail = (key: string, value: string): void => {
    process.stdout.write(`${timestamp()} ${' '.repeat(7)}${c.dim(padRight(key))}: ${value}\n`);
};

/** Plain summary line, no tag, just the message. */
export const printSummary = (msg: string): void => {
    process.stdout.write(`${timestamp()} ${c.bold(msg)}\n`);
};

/** Section heading, used by inspect to title the report. */
export const printHeading = (msg: string): void => {
    process.stdout.write(`${timestamp()} ${c.cyan(msg)}\n`);
};

/** Error message routed to stderr to match Node convention. */
export const printError = (msg: string): void => {
    process.stderr.write(`${timestamp()} ${c.red(msg)}\n`);
};
