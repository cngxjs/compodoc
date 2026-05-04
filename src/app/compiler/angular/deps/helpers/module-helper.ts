import type { ts } from 'ts-morph';
import type { Deps } from '../../dependencies.interfaces';
import type { ComponentCache } from './component-helper';
import { type ProviderEntry, SymbolHelper } from './symbol-helper';

export class ModuleHelper {
    constructor(
        private cache: ComponentCache,
        private symbolHelper: SymbolHelper = new SymbolHelper()
    ) {}

    /**
     * Module-level providers. Returns the structured `ProviderEntry[]` shape
     * and enriches each entry's `file` field from the import / local-variable
     * scan in `parseDeepIndentifier`, because `menu-helpers.ts` reads
     * `prov.file` to decide whether to hide the provider from the side menu.
     */
    public getModuleProviders(
        props: ReadonlyArray<ts.ObjectLiteralElementLike>,
        srcFile: ts.SourceFile
    ): ProviderEntry[] {
        const entries = this.symbolHelper.getProviderEntries(props, 'providers');
        for (const entry of entries) {
            if (entry.name) {
                const enriched = this.symbolHelper.parseDeepIndentifier(entry.name, srcFile);
                if (enriched?.file) {
                    (entry as any).file = enriched.file;
                }
            }
        }
        return entries;
    }

    public getModuleDeclarations(
        props: ReadonlyArray<ts.ObjectLiteralElementLike>,
        srcFile: ts.SourceFile
    ): Deps[] {
        return this.symbolHelper.getSymbolDeps(props, 'declarations', srcFile).map(name => {
            const component = this.cache.get(name);

            if (component) {
                return component;
            }

            return this.symbolHelper.parseDeepIndentifier(name, srcFile);
        });
    }

    public getModuleEntryComponents(
        props: ReadonlyArray<ts.ObjectLiteralElementLike>,
        srcFile: ts.SourceFile
    ): Deps[] {
        return this.symbolHelper.getSymbolDeps(props, 'entryComponents', srcFile).map(name => {
            const component = this.cache.get(name);

            if (component) {
                return component;
            }

            return this.symbolHelper.parseDeepIndentifier(name, srcFile);
        });
    }

    private cleanImportForRootForChild(name: string): string {
        const nsModule = name.split('.');
        if (nsModule.length > 0) {
            name = nsModule[0];
        }
        return name;
    }

    public getModuleImports(
        props: ReadonlyArray<ts.ObjectLiteralElementLike>,
        srcFile: ts.SourceFile
    ): Array<IParseDeepIdentifierResult> {
        return this.symbolHelper
            .getSymbolDeps(props, 'imports', srcFile)
            .map(name => this.cleanImportForRootForChild(name))
            .map(name => this.symbolHelper.parseDeepIndentifier(name));
    }

    public getModuleExports(
        props: ReadonlyArray<ts.ObjectLiteralElementLike>,
        srcFile: ts.SourceFile
    ): Array<IParseDeepIdentifierResult> {
        return this.symbolHelper
            .getSymbolDeps(props, 'exports', srcFile)
            .map(name => this.symbolHelper.parseDeepIndentifier(name, srcFile));
    }

    public getModuleImportsRaw(
        props: ReadonlyArray<ts.ObjectLiteralElementLike>,
        _srcFile: ts.SourceFile
    ): Array<ts.ObjectLiteralElementLike> {
        return this.symbolHelper.getSymbolDepsRaw(props, 'imports');
    }

    public getModuleId(
        props: ReadonlyArray<ts.ObjectLiteralElementLike>,
        srcFile: ts.SourceFile
    ): Array<IParseDeepIdentifierResult> {
        let _id = this.symbolHelper.getSymbolDeps(props, 'id', srcFile),
            id;
        if (_id.length === 1) {
            id = _id[0];
        }
        return id;
    }

    public getModuleSchemas(
        props: ReadonlyArray<ts.ObjectLiteralElementLike>,
        srcFile: ts.SourceFile
    ) {
        const schemas = this.symbolHelper.getSymbolDeps(props, 'schemas', srcFile);
        return schemas;
    }

    public getModuleBootstrap(
        props: ReadonlyArray<ts.ObjectLiteralElementLike>,
        srcFile: ts.SourceFile
    ): Array<IParseDeepIdentifierResult> {
        return this.symbolHelper
            .getSymbolDeps(props, 'bootstrap', srcFile)
            .map(name => this.symbolHelper.parseDeepIndentifier(name, srcFile));
    }
}
