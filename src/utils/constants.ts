export const COMPODOC_CONSTANTS = {
    navTabDefinitions: [
        {
            id: 'readme',
            href: '#readme',
            'data-link': 'readme',
            label: 'README',
            depTypes: ['all']
        },
        {
            id: 'info',
            href: '#info',
            'data-link': 'info',
            label: 'Info',
            depTypes: ['all']
        },
        {
            id: 'api',
            href: '#api',
            'data-link': 'api',
            label: 'API',
            depTypes: [
                'component',
                'directive',
                'injectable',
                'pipe',
                'class',
                'interface',
                'guard',
                'interceptor',
                'entity'
            ]
        },

        {
            id: 'source',
            href: '#source',
            'data-link': 'source',
            label: 'Source',
            depTypes: ['all']
        },
        {
            id: 'templateData',
            href: '#templateData',
            'data-link': 'template',
            label: 'Template',
            depTypes: ['component']
        },
        {
            id: 'styleData',
            href: '#styleData',
            'data-link': 'style',
            label: 'Styles',
            depTypes: ['component']
        },
        {
            id: 'tree',
            href: '#tree',
            'data-link': 'dom-tree',
            label: 'DOM Tree',
            depTypes: ['component']
        },
        {
            id: 'example',
            href: '#example',
            'data-link': 'example',
            label: 'Examples',
            depTypes: ['component', 'directive', 'injectable', 'pipe']
        }
    ]
};

/**
 * Default section buckets for the Info / API tab split.
 *
 * `DEFAULT_INFO_SECTIONS` → overview-style sections (description, metadata,
 * relationships, examples …) that sit on the Info tab.
 * `DEFAULT_API_SECTIONS`  → member-surface sections (index, constructor, inputs,
 * outputs, methods, properties …) that sit on the API tab.
 *
 * These defaults are applied by `isInfoSection()` / `isApiSection()` when the
 * user hasn't explicitly configured `infoTabSections` / `apiTabSections`.
 */
export const DEFAULT_INFO_SECTIONS: ReadonlyArray<string> = [
    'import',
    'deprecated',
    'description',
    'examples',
    'metadata',
    'extends',
    'relationships'
];

export const DEFAULT_API_SECTIONS: ReadonlyArray<string> = [
    'index',
    'constructor',
    'inputs',
    'outputs',
    'derivedState',
    'hostBindings',
    'hostListeners',
    'methods',
    'properties',
    'accessors',
    'indexSignatures'
];

/**
 * Max length for the string of a file during Lunr search engine indexing.
 * Prevent stack size exceeded
 */
export const MAX_SIZE_FILE_SEARCH_INDEX = 50000;

/**
 * Max length for the string of a file during cheerio parsing.
 * Prevent stack size exceeded
 */
export const MAX_SIZE_FILE_CHEERIO_PARSING = 400000000;
