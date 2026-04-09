import { SyntaxKind } from 'ts-morph';

const KIND_MAP: Partial<Record<SyntaxKind, string>> = {
    [SyntaxKind.PrivateKeyword]: 'Private',
    [SyntaxKind.ReadonlyKeyword]: 'Readonly',
    [SyntaxKind.ProtectedKeyword]: 'Protected',
    [SyntaxKind.PublicKeyword]: 'Public',
    [SyntaxKind.StaticKeyword]: 'Static',
    [SyntaxKind.AsyncKeyword]: 'Async',
    [SyntaxKind.AbstractKeyword]: 'Abstract'
};

/** Map a SyntaxKind modifier to its human-readable label. */
export const modifKind = (kind: SyntaxKind): string => KIND_MAP[kind] ?? '';
