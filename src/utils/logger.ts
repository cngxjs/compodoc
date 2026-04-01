import c from 'picocolors';

type LogLevel = 'info' | 'debug' | 'warn' | 'error';

const pad = (s: string, len: number): string =>
    s + ' '.repeat(Math.max(0, len - s.length));

const timestamp = (): string =>
    c.gray(`[${new Date().toLocaleTimeString()}]`);

const colorize = (level: LogLevel, msg: string): string => {
    switch (level) {
        case 'info': return c.green(msg);
        case 'debug': return c.cyan(msg);
        case 'warn': return c.yellow(msg);
        case 'error': return c.red(msg);
    }
};

const formatArgs = (args: unknown[]): string => {
    if (args.length > 1) {
        const first = String(args[0]);
        return `${pad(first, 15)}: ${args.slice(1).join(' ')}`;
    }
    return args.join(' ');
};

export type Logger = {
    silent: boolean;
    info(...args: unknown[]): void;
    warn(...args: unknown[]): void;
    debug(...args: unknown[]): void;
    error(...args: unknown[]): void;
};

export const createLogger = (): Logger => {
    const state = { silent: true };

    const write = (level: LogLevel, args: unknown[]) => {
        if (!state.silent && level !== 'error') return;
        const msg = colorize(level, formatArgs(args));
        process.stdout.write(`${timestamp()} ${msg}\n`);
    };

    return {
        get silent() { return state.silent; },
        set silent(v: boolean) { state.silent = v; },
        info: (...args: unknown[]) => write('info', args),
        warn: (...args: unknown[]) => write('warn', args),
        debug: (...args: unknown[]) => write('debug', args),
        error: (...args: unknown[]) => write('error', args),
    };
};

export const logger = createLogger();
