#!/usr/bin/env node
// Post-build step for the lib bundle: tsdown 0.21.x strips shebangs from entry
// points (rolldown/tsdown#886, #300). Prepend `#!/usr/bin/env node` and chmod
// +x for both the CJS and ESM CLI entries so `npx compodocx` works regardless
// of which one Node resolves.
import { chmodSync, readFileSync, writeFileSync } from 'node:fs';

const SHEBANG = '#!/usr/bin/env node\n';
const targets = ['dist/index-cli.js', 'dist/index-cli.mjs'];

for (const file of targets) {
    const src = readFileSync(file, 'utf8');
    if (!src.startsWith('#!')) {
        writeFileSync(file, SHEBANG + src);
    }
    chmodSync(file, 0o755);
}
