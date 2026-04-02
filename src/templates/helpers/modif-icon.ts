import { SyntaxKind } from 'ts-morph';

const ICON_MAP: Partial<Record<SyntaxKind, string>> = {
    [SyntaxKind.PrivateKeyword]: 'lock',
    [SyntaxKind.ProtectedKeyword]: 'lock',
    [SyntaxKind.StaticKeyword]: 'reset',
    [SyntaxKind.ExportKeyword]: 'export',
};

/** Map a SyntaxKind modifier to an icon suffix (ion-ios-{icon}). */
export const modifIcon = (kind: SyntaxKind): string => ICON_MAP[kind] ?? 'reset';

/** Get the icon for an array of modifier kinds (uses first match). */
export const modifIconFromArray = (kinds: SyntaxKind[]): string => {
    for (const k of kinds) {
        const icon = ICON_MAP[k];
        if (icon) return icon;
    }
    return 'reset';
};
