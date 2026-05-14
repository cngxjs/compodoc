import { exec } from 'node:child_process';
import polka from 'polka';
import sirv from 'sirv';

import { logger } from '../../utils/logger';

export interface ServeConfig {
    readonly host: string;
    readonly port: number;
    readonly open: boolean;
}

export function startWebServer(
    folder: string,
    cfg: ServeConfig,
    onListening?: (url: string) => void
): void {
    const assets = sirv(folder, { dev: true, single: false });
    const url = `http://${cfg.host}:${cfg.port}`;

    polka()
        .use(assets)
        .listen(cfg.port, cfg.host, () => {
            logger.info(`Serving on ${url}`);
            if (cfg.open) {
                openBrowser(url);
            }
            onListening?.(url);
        });
}

function openBrowser(url: string): void {
    switch (process.platform) {
        case 'darwin':
            exec(`open "${url}"`);
            break;
        case 'win32':
            exec(`start "" "${url}"`);
            break;
        default:
            exec(`xdg-open "${url}"`);
            break;
    }
}
