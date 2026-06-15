import * as fs from 'fs-extra';

import { logger } from '../../utils/logger';
import Configuration from '../configuration';
import { type FileRefBundle, type FsReader, readFileRef } from '../engines/stackblitz';

/**
 * Walk every entity kind that may carry `@playground fileRef` blocks
 * (components/directives/injectables/etc) and resolve each fileRef into
 * a `FileRefBundle` keyed by `${entityName}:${blockIndex}`. Read failures
 * surface as `logger.warn` and skip that block — the manifest builder
 * then falls back to its "Project assembly failed" path. Inline-only
 * playgrounds never enter this loop.
 */
export class PlaygroundFileResolver {
    public resolve(): void {
        const fsReader: FsReader = {
            readFile: (p: string): string | null => {
                try {
                    return fs.readFileSync(p, 'utf8');
                } catch {
                    return null;
                }
            },
            exists: (p: string): boolean => {
                try {
                    return fs.existsSync(p);
                } catch {
                    return false;
                }
            }
        };

        const out: Record<string, FileRefBundle> = {};
        const entitySources = [
            Configuration.mainData.components,
            Configuration.mainData.directives,
            Configuration.mainData.injectables,
            Configuration.mainData.guards,
            Configuration.mainData.interceptors,
            Configuration.mainData.pipes,
            Configuration.mainData.classes,
            Configuration.mainData.interfaces,
            Configuration.mainData.entities
        ];

        for (const list of entitySources) {
            if (!Array.isArray(list)) {
                continue;
            }
            for (const entity of list) {
                const playgrounds = entity?.playgrounds as
                    | Array<{ title?: string; fileRef?: string }>
                    | undefined;
                if (!playgrounds || playgrounds.length === 0) {
                    continue;
                }
                for (let i = 0; i < playgrounds.length; i++) {
                    const block = playgrounds[i];
                    if (!block?.fileRef) {
                        continue;
                    }
                    const hostFile = entity.file;
                    if (typeof hostFile !== 'string' || hostFile.length === 0) {
                        logger.warn(
                            `Playground "${block.title ?? '<untitled>'}" on ${entity.name}: missing host file path`
                        );
                        continue;
                    }
                    const result = readFileRef(block.fileRef, hostFile, fsReader, {
                        maxFiles: Configuration.mainData.playgroundFileCountCap
                    });
                    if (!result.ok) {
                        logger.warn(
                            `Playground "${block.title ?? '<untitled>'}" on ${entity.name}: ${result.error}`
                        );
                        continue;
                    }
                    out[`${entity.name}:${i}`] = result.value;
                }
            }
        }

        Configuration.mainData.playgroundFiles = out;
    }
}
