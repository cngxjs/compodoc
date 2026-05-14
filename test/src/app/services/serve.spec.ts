import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

type ListenCall = {
    port: number;
    host: string;
    cb: () => void;
};

const listenCalls: ListenCall[] = [];
const sirvCalls: Array<{ folder: string; opts: unknown }> = [];
const execCalls: string[] = [];
let polkaInstance: { use: ReturnType<typeof vi.fn>; listen: ReturnType<typeof vi.fn> };

vi.mock('polka', () => {
    const polkaFactory = vi.fn(() => {
        polkaInstance = {
            use: vi.fn(() => polkaInstance),
            listen: vi.fn((port: number, host: string, cb: () => void) => {
                listenCalls.push({ port, host, cb });
                return polkaInstance;
            })
        };
        return polkaInstance;
    });
    return { default: polkaFactory };
});

vi.mock('sirv', () => ({
    default: vi.fn((folder: string, opts: unknown) => {
        sirvCalls.push({ folder, opts });
        return () => {};
    })
}));

vi.mock('node:child_process', () => ({
    exec: vi.fn((cmd: string) => {
        execCalls.push(cmd);
    })
}));

vi.mock('../../../../src/utils/logger', () => ({
    logger: {
        info: vi.fn(),
        warn: vi.fn(),
        debug: vi.fn(),
        error: vi.fn()
    }
}));

import { startWebServer } from '../../../../src/app/services/serve';

describe('startWebServer', () => {
    const originalPlatform = process.platform;

    beforeEach(() => {
        listenCalls.length = 0;
        sirvCalls.length = 0;
        execCalls.length = 0;
    });

    afterEach(() => {
        Object.defineProperty(process, 'platform', { value: originalPlatform });
        vi.clearAllMocks();
    });

    it('mounts sirv on the given folder with dev:true single:false', () => {
        startWebServer('/tmp/docs', { host: 'localhost', port: 8080, open: false });
        expect(sirvCalls).toHaveLength(1);
        expect(sirvCalls[0].folder).toBe('/tmp/docs');
        expect(sirvCalls[0].opts).toEqual({ dev: true, single: false });
    });

    it('passes the host and port to polka.listen', () => {
        startWebServer('/tmp/docs', { host: '127.0.0.1', port: 9100, open: false });
        expect(listenCalls).toHaveLength(1);
        expect(listenCalls[0].port).toBe(9100);
        expect(listenCalls[0].host).toBe('127.0.0.1');
    });

    it('does not spawn a browser when open=false', () => {
        startWebServer('/tmp/docs', { host: 'localhost', port: 8080, open: false });
        listenCalls[0].cb();
        expect(execCalls).toHaveLength(0);
    });

    it('spawns "open" on darwin when open=true', () => {
        Object.defineProperty(process, 'platform', { value: 'darwin' });
        startWebServer('/tmp/docs', { host: 'localhost', port: 8080, open: true });
        listenCalls[0].cb();
        expect(execCalls).toEqual(['open "http://localhost:8080"']);
    });

    it('spawns "start" on win32 when open=true', () => {
        Object.defineProperty(process, 'platform', { value: 'win32' });
        startWebServer('/tmp/docs', { host: 'localhost', port: 8080, open: true });
        listenCalls[0].cb();
        expect(execCalls).toEqual(['start "" "http://localhost:8080"']);
    });

    it('spawns "xdg-open" on linux when open=true', () => {
        Object.defineProperty(process, 'platform', { value: 'linux' });
        startWebServer('/tmp/docs', { host: 'localhost', port: 8080, open: true });
        listenCalls[0].cb();
        expect(execCalls).toEqual(['xdg-open "http://localhost:8080"']);
    });

    it('invokes onListening with the resolved URL after listen fires', () => {
        const onListening = vi.fn();
        startWebServer('/tmp/docs', { host: 'example.test', port: 4444, open: false }, onListening);
        listenCalls[0].cb();
        expect(onListening).toHaveBeenCalledWith('http://example.test:4444');
    });
});
