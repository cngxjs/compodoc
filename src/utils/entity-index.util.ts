
export interface EntityIndexEntry {
    href: string;
    kind: string;
}

export type EntityIndex = Record<string, EntityIndexEntry>;

interface EntityLike {
    name: string;
    id?: string;
    isDuplicate?: boolean;
    duplicateId?: number;
}

const ENTITY_COLLECTIONS: Array<{ key: string; path: string; kind: string }> = [
    { key: 'modules', path: 'modules', kind: 'module' },
    { key: 'components', path: 'components', kind: 'component' },
    { key: 'directives', path: 'directives', kind: 'directive' },
    { key: 'injectables', path: 'injectables', kind: 'injectable' },
    { key: 'pipes', path: 'pipes', kind: 'pipe' },
    { key: 'classes', path: 'classes', kind: 'class' },
    { key: 'interfaces', path: 'interfaces', kind: 'interface' },
    { key: 'guards', path: 'guards', kind: 'guard' },
    { key: 'interceptors', path: 'interceptors', kind: 'interceptor' },
];

/** Build the entity index from mainData. Call after entity collection, before rendering. */
export function buildEntityIndex(mainData: Record<string, unknown>): EntityIndex {
    const index: EntityIndex = {};

    for (const { key, path, kind } of ENTITY_COLLECTIONS) {
        const entities = mainData[key] as EntityLike[] | undefined;
        if (!entities) continue;

        for (const entity of entities) {
            let pageName = entity.name;
            if (entity.isDuplicate && entity.duplicateId !== undefined) {
                pageName += '-' + entity.duplicateId;
            }
            index[entity.name] = {
                href: `${path}/${pageName}.html`,
                kind
            };
        }
    }

    const misc = mainData['miscellaneous'] as Record<string, EntityLike[]> | undefined;
    if (misc) {
        const miscKinds: Array<{ key: string; kind: string }> = [
            { key: 'functions', kind: 'function' },
            { key: 'variables', kind: 'variable' },
            { key: 'typealiases', kind: 'typealias' },
            { key: 'enumerations', kind: 'enum' },
        ];
        for (const { key, kind } of miscKinds) {
            const items = misc[key];
            if (!items) continue;
            for (const item of items) {
                index[item.name] = {
                    href: `miscellaneous/${kind === 'typealias' ? 'typealiases' : key}.html`,
                    kind
                };
            }
        }
    }

    return index;
}
