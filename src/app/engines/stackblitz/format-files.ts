import { STACKBLITZ_FILE_CAP, STACKBLITZ_TRUNCATION_FOOTER } from './constants';

/**
 * Bottleneck file-content emitter — every string the manifest builder writes
 * into the StackBlitz `files` map flows through this function. F23: accepts
 * `unknown` so production data shapes that violate the type contract never
 * crash the build path. F24: applies the per-file truncation cap exactly
 * once so future revisions lift the cap in a single place.
 */
export function emitFileContent(content: unknown): string {
    const text = String(content ?? '').replaceAll('\r\n', '\n');
    if (text.length <= STACKBLITZ_FILE_CAP) {
        return text;
    }
    return text.slice(0, STACKBLITZ_FILE_CAP) + STACKBLITZ_TRUNCATION_FOOTER;
}
