import { Rule, SchematicContext, Tree, SchematicsException } from '@angular-devkit/schematics';
import { NodePackageInstallTask } from '@angular-devkit/schematics/tasks';
import type { NgAddSchema } from './schema';

const TSCONFIG_DATA = {
    include: ['src/**/*.ts'],
    exclude: ['src/**/*.spec.ts']
};

function safeReadJSON(path: string, tree: Tree): { [key: string]: unknown } {
    const file = tree.read(path);
    if (!file) {
        throw new SchematicsException(`Could not read ${path}`);
    }
    try {
        return JSON.parse(file.toString());
    } catch (e) {
        const message = e instanceof Error ? e.message : String(e);
        throw new SchematicsException(`Error when parsing ${path}: ${message}`);
    }
}

// Just return the tree
export function ngAdd(_options: NgAddSchema = {}): Rule {
    return (tree: Tree, context: SchematicContext) => {
        // Create tsconfig.doc.json file
        const tsconfigDocFile = 'tsconfig.doc.json';
        if (!tree.exists(tsconfigDocFile)) {
            tree.create(tsconfigDocFile, JSON.stringify(TSCONFIG_DATA));
        }

        const packageJsonFile = 'package.json';
        if (!tree.exists(packageJsonFile)) {
            throw new SchematicsException('Could not locate package.json');
        }
        const packageJson = safeReadJSON(packageJsonFile, tree);

        const packageScripts: { [key: string]: string } =
            (packageJson['scripts'] as { [key: string]: string } | undefined) ?? {};
        packageScripts['compodoc:build'] = 'compodoc -p tsconfig.doc.json';
        packageScripts['compodoc:build-and-serve'] = 'compodoc -p tsconfig.doc.json -s';
        packageScripts['compodoc:serve'] = 'compodoc -s';
        packageJson['scripts'] = packageScripts;

        tree.overwrite(packageJsonFile, JSON.stringify(packageJson, null, 2));

        context.addTask(new NodePackageInstallTask());
        return tree;
    };
}
