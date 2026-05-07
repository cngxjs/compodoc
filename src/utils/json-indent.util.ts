import { logger } from './logger';

/**
 * Validate the `--jsonIndent` flag (and the matching config-file field).
 *
 * Accepts an integer between 0 and 8, inclusive — same range Node's
 * `JSON.stringify(value, replacer, space)` honours before silently capping.
 * Anything else exits the process with a clear error so users notice the
 * typo instead of getting silent fallback to 0.
 *
 * `source` is used purely to make the error message friendlier; pass
 * `'flag'` from CLI parsing and `'config'` from cosmiconfig file loads.
 */
export function parseJsonIndent(raw: unknown, source: 'flag' | 'config' = 'flag'): number {
    const label = source === 'flag' ? '--jsonIndent' : 'jsonIndent in config file';

    if (typeof raw === 'number') {
        return assertInRange(raw, label);
    }

    if (typeof raw === 'string') {
        const trimmed = raw.trim();
        if (trimmed === '') {
            logger.error(`${label} requires a value between 0 and 8`);
            process.exit(1);
        }
        const parsed = Number(trimmed);
        if (!Number.isFinite(parsed) || !/^-?\d+$/.test(trimmed)) {
            logger.error(`${label} must be an integer between 0 and 8 (got "${raw}")`);
            process.exit(1);
        }
        return assertInRange(parsed, label);
    }

    logger.error(`${label} must be an integer between 0 and 8`);
    process.exit(1);
}

function assertInRange(value: number, label: string): number {
    if (!Number.isInteger(value) || value < 0 || value > 8) {
        logger.error(`${label} must be an integer between 0 and 8 (got ${value})`);
        process.exit(1);
    }
    return value;
}
