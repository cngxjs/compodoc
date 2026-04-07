/**
 * Extract entity declaration (decorator + class signature) from source code.
 * Collapses method bodies and keeps only signatures for a compact preview.
 */

const DECORATOR_RE = /^@(Component|Directive|Injectable|Pipe|NgModule)\s*\(/m;
const CLASS_RE = /^export\s+(abstract\s+)?(class|interface)\s+/m;
const MAX_LINES = 20;

/**
 * Extract the declaration portion of a TypeScript entity source file.
 * Returns the decorator (if any) + class/interface signature with method bodies collapsed.
 * Returns null if extraction fails (unusual syntax).
 */
export const extractDeclaration = (sourceCode: string): string | null => {
    if (!sourceCode?.trim()) return null;

    const lines = sourceCode.split('\n');

    // Find start: decorator or export class/interface
    let startIdx = -1;
    const decoratorMatch = sourceCode.match(DECORATOR_RE);
    const classMatch = sourceCode.match(CLASS_RE);

    if (decoratorMatch) {
        const decoratorLine = sourceCode.substring(0, decoratorMatch.index).split('\n').length - 1;
        startIdx = decoratorLine;
    } else if (classMatch) {
        const classLine = sourceCode.substring(0, classMatch.index).split('\n').length - 1;
        startIdx = classLine;
    }

    if (startIdx === -1) return null;

    // Find the class opening brace and then track brace depth to find the closing brace
    let depth = 0;
    let classBodyStart = -1;
    let endIdx = -1;

    for (let i = startIdx; i < lines.length; i++) {
        const line = lines[i];
        for (const ch of line) {
            if (ch === '{') {
                depth++;
                if (depth === 1) classBodyStart = i;
            }
            if (ch === '}') {
                depth--;
                if (depth === 0) {
                    endIdx = i;
                    break;
                }
            }
        }
        if (endIdx !== -1) break;
    }

    if (endIdx === -1 || classBodyStart === -1) return null;

    // Extract from startIdx to endIdx
    const extracted = lines.slice(startIdx, endIdx + 1);

    // Collapse method bodies: replace content between { } at depth 2 with ...
    const result: string[] = [];
    let bodyDepth = 0;
    let inMethodBody = false;
    let methodCount = 0;
    let propertyCount = 0;

    for (const line of extracted) {
        let lineDepth = bodyDepth;
        for (const ch of line) {
            if (ch === '{') bodyDepth++;
            if (ch === '}') bodyDepth--;
        }

        if (lineDepth <= 1) {
            // We're at class level or above -- include the line
            if (inMethodBody) {
                // Coming out of a method body, add the closing line
                inMethodBody = false;
            }
            result.push(line);

            // Count members at class level (depth 1)
            if (lineDepth === 1) {
                const trimmed = line.trim();
                if (trimmed.match(/^\w.*\(/) && !trimmed.startsWith('//')) methodCount++;
                else if (trimmed.match(/^\w/) && (trimmed.includes('=') || trimmed.includes(':')) && !trimmed.startsWith('//')) propertyCount++;
            }
        } else if (lineDepth === 2 && !inMethodBody) {
            // First line inside a method body -- replace with ...
            inMethodBody = true;
            result.push('    // ...');
        }
        // Lines deeper than depth 2 inside method body are skipped
    }

    // If too long, truncate
    if (result.length > MAX_LINES) {
        // Keep decorator + class signature (up to opening brace), then summary
        const headerEnd = result.findIndex(l => l.includes('{') && !l.trim().startsWith('@'));
        if (headerEnd >= 0) {
            const header = result.slice(0, headerEnd + 1);
            const summary = methodCount > 0 || propertyCount > 0
                ? `  // ${methodCount} methods, ${propertyCount} properties`
                : '  // ...';
            return [...header, summary, '}'].join('\n');
        }
    }

    return result.join('\n');
};
