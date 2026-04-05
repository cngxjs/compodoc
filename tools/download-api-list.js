const https = require('https');
const fs = require('fs');

const MANIFEST_URL = 'https://angular.dev/assets/api/manifest.json';
const OUTPUT_PATH = 'src/data/api-list.json';

// Map angular.dev ApiItemType to compodocx docType
const TYPE_MAP = {
    block: 'block',
    undecorated_class: 'class',
    constant: 'const',
    decorator: 'decorator',
    directive: 'directive',
    element: 'element',
    enum: 'enum',
    function: 'function',
    interface: 'interface',
    pipe: 'pipe',
    ng_module: 'ngmodule',
    type_alias: 'type-alias',
    initializer_api_function: 'function',
};

function getStability(entry) {
    if (entry.deprecated) return 'deprecated';
    if (entry.developerPreview) return 'experimental';
    if (entry.experimental) return 'experimental';
    return 'stable';
}

function getPackagePath(normalizedModuleName) {
    let name = normalizedModuleName;
    if (name.startsWith('angular_')) {
        name = name.slice('angular_'.length);
    }
    return name.replace(/_/g, '/');
}

function convertManifest(manifest) {
    return manifest.map(pkg => {
        const packagePath = getPackagePath(pkg.normalizedModuleName);
        const title = pkg.moduleLabel.replace('@angular/', '');

        return {
            name: title.toLowerCase().replace(/\//g, '-'),
            title,
            path: `api/${packagePath}`,
            items: pkg.entries.map(entry => ({
                name: entry.name.toLowerCase(),
                title: entry.name,
                path: `api/${packagePath}/${entry.name}`,
                docType: TYPE_MAP[entry.type] || entry.type,
                stability: getStability(entry),
                securityRisk: false,
            })),
        };
    });
}

https.get(MANIFEST_URL, res => {
    if (res.statusCode !== 200) {
        console.error(`Download failed: ${res.statusCode}`);
        process.exit(1);
    }

    let data = '';
    res.on('data', chunk => { data += chunk; });
    res.on('end', () => {
        try {
            const manifest = JSON.parse(data);
            const apiList = convertManifest(manifest);
            const totalEntries = apiList.reduce((sum, pkg) => sum + pkg.items.length, 0);

            fs.writeFileSync(OUTPUT_PATH, JSON.stringify(apiList, null, 2));
            console.log(`Written ${apiList.length} packages with ${totalEntries} entries to ${OUTPUT_PATH}`);
        } catch (err) {
            console.error('Failed to parse manifest:', err.message);
            process.exit(1);
        }
    });
}).on('error', err => {
    console.error('Download error:', err.message);
    process.exit(1);
});
