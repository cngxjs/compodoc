import * as JSON5 from 'json5';
import { logger } from '../logger';

export class RawRouteCleaner {
    private readonly transformAngular8ImportSyntax =
        /(['"]loadChildren['"]:)\(\)(:[^)]+?)?=>"import\((\\'|'|"|`)([^'"]+?)(\\'|'|"|`)\)\.then\(\(?\w+?\)?=>\S+?\.([^)]+?)\)(\\'|'|")/g;
    private readonly transformAngular8ImportSyntaxComponent =
        /(['"]loadComponent['"]:)\(\)(:[^)]+?)?=>"import\((\\'|'|"|`)([^'"]+?)(\\'|'|"|`)\)\.then\(\(?\w+?\)?=>\S+?\.([^)]+?)\)(\\'|'|")/g;
    private readonly transformAngular8ImportSyntaxAsyncAwait =
        /(['"]loadChildren['"]:)\(\)(:[^)]+?)?=>\("import\((\\'|'|"|`)([^'"]+?)(\\'|'|"|`)\)"\)\.['"]([^)]+?)['"]/g;
    private readonly transformAngular8ImportSyntaxComponentAsyncAwait =
        /(['"]loadComponent['"]:)\(\)(:[^)]+?)?=>\("import\((\\'|'|"|`)([^'"]+?)(\\'|'|"|`)\)"\)\.['"]([^)]+?)['"]/g;
    private readonly trailingComma = /,\s*([\]})])/g;

    public cleanRawRouteParsed(route: string): object {
        try {
            return JSON5.parse(this.cleanRawRoute(route));
        } catch (parseError) {
            logger.error(
                `Failed to parse route data. This may be caused by special characters in file paths or route configurations.`
            );
            logger.debug(`Raw route data: ${route}`);
            logger.debug(`Cleaned route data: ${this.cleanRawRoute(route)}`);
            logger.debug(`Parse error: ${parseError.message}`);
            throw parseError;
        }
    }

    public cleanRawRoute(route: string): string {
        let cleaned = route
            .replace(/\s/g, '')
            .replace(this.trailingComma, '$1')
            .replace(this.transformAngular8ImportSyntax, '$1"$4#$6"')
            .replace(this.transformAngular8ImportSyntaxAsyncAwait, '$1"$4#$6"')
            .replace(this.transformAngular8ImportSyntaxComponent, '$1"$4#$6"')
            .replace(this.transformAngular8ImportSyntaxComponentAsyncAwait, '$1"$4#$6"');

        // Additional cleaning for special characters that cause JSON5 parsing issues
        // Handle unescaped characters in string literals
        cleaned = cleaned
            // Fix template literal expressions that get converted incorrectly
            // Convert ${VAR}/something patterns to "VAR/something" format
            .replace(/\$\{([^}]+)\}\/([^"',}\s]+)/g, '"$1/$2"')
            .replace(/\$\{([^}]+)\}/g, '"$1"')
            // Fix malformed string concatenations from template literals
            .replace(/"([^"]*?)"\/"([^"]*?)"/g, '"$1/$2"')
            .replace(/"([^"]*?)"\+([^"]*?)\+"([^"]*?)"/g, '"$1+$2+$3"')
            // Fix double quotes issues in path strings
            .replace(/""([^"]*?)""/g, '"$1"')
            // Fix malformed string concatenations
            .replace(/([^"])"([^"]*?)\.([^"]*?)"([^"])/g, '$1"$2\\.$3"$4')
            // Fix unescaped plus signs in string literals
            .replace(/([^"])"([^"]*?)\+([^"]*?)"([^"])/g, '$1"$2\\+$3"$4')
            // Fix unescaped parentheses in string literals
            .replace(/([^"])"([^"]*?)\(([^"]*?)"([^"])/g, '$1"$2\\($3"$4')
            .replace(/([^"])"([^"]*?)\)([^"]*?)"([^"])/g, '$1"$2\\)$3"$4');

        return cleaned;
    }
}
