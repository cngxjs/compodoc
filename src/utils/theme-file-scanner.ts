import * as path from 'node:path';
import * as fs from 'fs-extra';
import { logger } from './logger';

export interface ThemeFile {
    name: string;
    content: string;
    language: 'scss' | 'css' | 'md';
}

export const THEME_FILE_RE = /(?:^|[-._])theme\.(scss|css|md)$/i;

const EXT_TO_LANG: Record<string, ThemeFile['language']> = {
    scss: 'scss',
    css: 'css',
    md: 'md'
};

export function collectThemeFiles(entityFilePath: string | undefined | null): ThemeFile[] {
    if (!entityFilePath) {
        return [];
    }

    const dir = path.dirname(entityFilePath);
    let entries: string[];
    try {
        entries = fs.readdirSync(dir);
    } catch (err) {
        logger.warn(`collectThemeFiles: unable to read ${dir}: ${(err as Error).message}`);
        return [];
    }

    const themeFiles: ThemeFile[] = [];
    for (const name of entries) {
        const match = name.match(THEME_FILE_RE);
        if (!match) {
            continue;
        }
        const ext = match[1].toLowerCase();
        const language = EXT_TO_LANG[ext];
        if (!language) {
            continue;
        }
        const fullPath = path.join(dir, name);
        let content: string;
        try {
            content = fs.readFileSync(fullPath, 'utf8');
        } catch (err) {
            logger.warn(`collectThemeFiles: unable to read ${fullPath}: ${(err as Error).message}`);
            continue;
        }
        themeFiles.push({ name, content, language });
    }

    themeFiles.sort((a, b) => a.name.localeCompare(b.name));
    return themeFiles;
}
