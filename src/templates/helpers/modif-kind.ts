import { SyntaxKind } from 'ts-morph';

const KIND_MAP: Partial<Record<SyntaxKind, { label: string; slug: string }>> = {
    [SyntaxKind.PrivateKeyword]: { label: 'Private', slug: 'private' },
    [SyntaxKind.ReadonlyKeyword]: { label: 'Readonly', slug: 'readonly' },
    [SyntaxKind.ProtectedKeyword]: { label: 'Protected', slug: 'protected' },
    [SyntaxKind.PublicKeyword]: { label: 'Public', slug: 'public' },
    [SyntaxKind.StaticKeyword]: { label: 'Static', slug: 'static' },
    [SyntaxKind.AsyncKeyword]: { label: 'Async', slug: 'async' },
    [SyntaxKind.AbstractKeyword]: { label: 'Abstract', slug: 'abstract' }
};

/** Map a SyntaxKind modifier to its human-readable label. */
export const modifKind = (kind: SyntaxKind): string => KIND_MAP[kind]?.label ?? '';

/** Map a SyntaxKind modifier to its CSS slug (e.g. 'private', 'readonly'). */
export const modifSlug = (kind: SyntaxKind): string => KIND_MAP[kind]?.slug ?? '';
