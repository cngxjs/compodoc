import Configuration from '../configuration';
import { MiscellaneousData } from '../interfaces/miscellaneous-data.interface';
import { ParsedData } from '../interfaces/parsed-data.interface';
import { RouteInterface } from '../interfaces/routes.interface';

import AngularApiUtil from '../../utils/angular-api.util';
import { IApiSourceResult } from '../../utils/api-source-result.interface';
import { getNamesCompareFn } from '../../utils/utils';

import {
    IDep,
    IEnumDecDep,
    IFunctionDecDep,
    IGuardDep,
    IInjectableDep,
    IInterceptorDep,
    IInterfaceDep,
    IPipeDep,
    ITypeAliasDecDep
} from '../compiler/angular/dependencies.interfaces';

import traverse from 'neotraverse/legacy';
import { IComponentDep } from '../compiler/angular/deps/component-dep.factory';
import { IDirectiveDep } from '../compiler/angular/deps/directive-dep.factory';
import { IModuleDep } from '../compiler/angular/deps/module-dep.factory';

export interface GroupNode {
    name: string;       // segment name (single folder)
    fullPath: string;   // e.g. "features/admin"
    items: any[];       // entities directly in this folder
    children: GroupNode[];
}

function deriveGroupKey(filePath: string): string {
    if (!filePath) return '';

    // Normalize path separators
    let rel = filePath.replace(/\\/g, '/');

    // Strip everything up to and including a known app root marker
    for (const marker of ['src/app/', 'src/', 'app/', 'lib/']) {
        const idx = rel.indexOf(marker);
        if (idx !== -1) {
            rel = rel.slice(idx + marker.length);
            break;
        }
    }

    // Take parent directory segments (exclude filename) — full path, no truncation
    const segments = rel.split('/').slice(0, -1);
    if (segments.length === 0) return '';

    return segments.join('/');
}

/**
 * Convert flat `Record<string, items[]>` into a GroupNode tree.
 * Mirrors the actual folder structure — no path compression.
 */
export function buildGroupTree(groups: Record<string, any[]>): GroupNode[] {
    interface TrieNode {
        name: string;
        fullPath: string;
        items: any[];
        children: Map<string, TrieNode>;
    }

    const root: TrieNode = { name: '', fullPath: '', items: [], children: new Map() };

    for (const [key, items] of Object.entries(groups)) {
        const segments = key.split('/');
        let current = root;
        let pathSoFar = '';
        for (const seg of segments) {
            pathSoFar = pathSoFar ? `${pathSoFar}/${seg}` : seg;
            if (!current.children.has(seg)) {
                current.children.set(seg, {
                    name: seg,
                    fullPath: pathSoFar,
                    items: [],
                    children: new Map()
                });
            }
            current = current.children.get(seg)!;
        }
        current.items = items;
    }

    const toGroupNodes = (node: TrieNode): GroupNode[] => {
        const result: GroupNode[] = [];
        for (const child of node.children.values()) {
            result.push({
                name: child.name,
                fullPath: child.fullPath,
                items: child.items,
                children: toGroupNodes(child)
            });
        }
        result.sort((a, b) => a.name.localeCompare(b.name));
        return result;
    };

    return toGroupNodes(root);
}

export class DependenciesEngine {
    public rawData: ParsedData;
    public modules: IModuleDep[];
    public rawModules: IModuleDep[];
    public rawModulesForOverview: IModuleDep[];
    public components: IComponentDep[];
    public entities: IDep[];
    public directives: IDirectiveDep[];
    public injectables: IInjectableDep[];
    public interceptors: IInterceptorDep[];
    public guards: IGuardDep[];
    public interfaces: IInterfaceDep[];
    public routes: RouteInterface;
    public pipes: IPipeDep[];
    public classes: IDep[];
    public categorizedComponents: Record<string, IComponentDep[]> = {};
    public categorizedDirectives: Record<string, IDirectiveDep[]> = {};
    public categorizedInjectables: Record<string, IInjectableDep[]> = {};
    public categorizedPipes: Record<string, IPipeDep[]> = {};
    public categorizedClasses: Record<string, IDep[]> = {};
    public categorizedInterfaces: Record<string, IInterfaceDep[]> = {};
    public categorizedGuards: Record<string, IGuardDep[]> = {};
    public categorizedInterceptors: Record<string, IInterceptorDep[]> = {};
    public categorizedEntities: Record<string, IDep[]> = {};
    public appConfig: any[] = [];
    public rawStandaloneComponents: IComponentDep[] = [];
    public rawStandaloneDirectives: IDirectiveDep[] = [];
    public rawStandalonePipes: IPipeDep[] = [];
    public miscellaneous: MiscellaneousData = {
        variables: [],
        functions: [],
        typealiases: [],
        enumerations: [],
        groupedVariables: [],
        groupedFunctions: [],
        groupedEnumerations: [],
        groupedTypeAliases: []
    };

    private static instance: DependenciesEngine;
    private constructor() {}
    public static getInstance() {
        if (!DependenciesEngine.instance) {
            DependenciesEngine.instance = new DependenciesEngine();
        }
        return DependenciesEngine.instance;
    }

    private updateModulesDeclarationsExportsTypes() {
        const mergeTypes = entry => {
            const directive = this.findInCompodocDependencies(
                entry.name,
                this.directives,
                entry.file
            );
            if (typeof directive.data !== 'undefined') {
                entry.type = 'directive';
                entry.id = directive.data.id;
            }

            const component = this.findInCompodocDependencies(
                entry.name,
                this.components,
                entry.file
            );
            if (typeof component.data !== 'undefined') {
                entry.type = 'component';
                entry.id = component.data.id;
            }

            const pipe = this.findInCompodocDependencies(entry.name, this.pipes, entry.file);
            if (typeof pipe.data !== 'undefined') {
                entry.type = 'pipe';
                entry.id = pipe.data.id;
            }
        };

        this.modules.forEach((module: any) => {
            module.declarations.forEach(declaration => {
                mergeTypes(declaration);
            });
            module.exports.forEach(expt => {
                mergeTypes(expt);
            });
            module.entryComponents.forEach(ent => {
                mergeTypes(ent);
            });
        });
    }

    public init(data: ParsedData) {
        traverse(data).forEach(function (node) {
            if (node) {
                if (node.parent) {
                    delete node.parent;
                }
                if (node.initializer) {
                    delete node.initializer;
                }
            }
        });
        this.rawData = data;
        this.modules = [...this.rawData.modules].sort((a, b) => (a as any).name.toLowerCase().localeCompare((b as any).name.toLowerCase()));
        this.rawModulesForOverview = [...data.modulesForGraph].sort((a, b) => (a as any).name.toLowerCase().localeCompare((b as any).name.toLowerCase()));
        this.rawModules = [...data.modulesForGraph].sort((a, b) => (a as any).name.toLowerCase().localeCompare((b as any).name.toLowerCase()));
        this.components = [...this.rawData.components].sort((a, b) => (a as any).name.toLowerCase().localeCompare((b as any).name.toLowerCase()));
        this.entities = [...this.rawData.entities].sort((a, b) => (a as any).name.toLowerCase().localeCompare((b as any).name.toLowerCase()));
        this.directives = [...this.rawData.directives].sort((a, b) => (a as any).name.toLowerCase().localeCompare((b as any).name.toLowerCase()));
        this.injectables = [...this.rawData.injectables].sort((a, b) => (a as any).name.toLowerCase().localeCompare((b as any).name.toLowerCase()));
        this.interceptors = [...this.rawData.interceptors].sort((a, b) => (a as any).name.toLowerCase().localeCompare((b as any).name.toLowerCase()));
        this.guards = [...this.rawData.guards].sort((a, b) => (a as any).name.toLowerCase().localeCompare((b as any).name.toLowerCase()));
        this.interfaces = [...this.rawData.interfaces].sort((a, b) => (a as any).name.toLowerCase().localeCompare((b as any).name.toLowerCase()));
        this.pipes = [...this.rawData.pipes].sort((a, b) => (a as any).name.toLowerCase().localeCompare((b as any).name.toLowerCase()));
        this.classes = [...this.rawData.classes].sort((a, b) => (a as any).name.toLowerCase().localeCompare((b as any).name.toLowerCase()));
        this.appConfig = this.rawData.appConfig || [];
        this.miscellaneous = this.rawData.miscellaneous;
        this.prepareMiscellaneous();
        this.updateModulesDeclarationsExportsTypes();
        this.inferStandaloneStatus();
        this.routes = this.rawData.routesTree;
        this.manageDuplicatesName();
        this.cleanRawModulesNames();
        this.prepareCategoryGroups();
    }

    private inferStandaloneStatus() {
        // Collect all names declared in any NgModule
        const declaredNames = new Set<string>();
        this.modules.forEach((module: any) => {
            if (module.declarations) {
                module.declarations.forEach(d => declaredNames.add(d.name));
            }
        });

        // Components: if explicitly standalone OR not declared in any module -> standalone
        this.components.forEach((comp: any) => {
            if (!comp.standalone && !declaredNames.has(comp.name)) {
                comp.standalone = true;
            }
        });
        this.rawStandaloneComponents = this.components.filter((c: any) => c.standalone);

        // Directives: same logic
        this.directives.forEach((dir: any) => {
            if (!dir.standalone && !declaredNames.has(dir.name)) {
                dir.standalone = true;
            }
        });
        this.rawStandaloneDirectives = this.directives.filter((d: any) => d.standalone);

        // Pipes: same logic
        this.pipes.forEach((pipe: any) => {
            if (!pipe.standalone && !declaredNames.has(pipe.name)) {
                pipe.standalone = true;
            }
        });
        this.rawStandalonePipes = this.pipes.filter((p: any) => p.standalone);
    }

    private cleanRawModulesNames() {
        this.rawModulesForOverview = this.rawModulesForOverview.map((module: any) => {
            module.name = module.name.replace('$', '');
            return module;
        });
    }

    private findInCompodocDependencies(name, data, file?): IApiSourceResult<any> {
        let _result = {
            source: 'internal',
            data: undefined,
            score: 0
        };
        let nameFoundCounter = 0;
        if (data && data.length > 0) {
            for (let i = 0; i < data.length; i++) {
                if (typeof name !== 'undefined') {
                    if (typeof file !== 'undefined') {
                        if (
                            name === data[i].name &&
                            file.replace(/\\/g, '/').indexOf(data[i].file) !== -1
                        ) {
                            nameFoundCounter += 1;
                            _result.data = data[i];
                            _result.score = 2;
                        } else if (
                            name.indexOf(data[i].name) !== -1 &&
                            file.replace(/\\/g, '/').indexOf(data[i].file) !== -1
                        ) {
                            nameFoundCounter += 1;
                            _result.data = data[i];
                            _result.score = 1;
                        }
                    } else {
                        if (name === data[i].name) {
                            nameFoundCounter += 1;
                            _result.data = data[i];
                            _result.score = 2;
                        } else if (name.indexOf(data[i].name) !== -1) {
                            nameFoundCounter += 1;
                            _result.data = data[i];
                            _result.score = 1;
                        }
                    }
                }
            }

            // Prevent wrong matching like MultiSelectOptionDirective with SelectOptionDirective, or QueryParamGroupService with QueryParamGroup
            if (nameFoundCounter > 1) {
                let found = false;
                for (let i = 0; i < data.length; i++) {
                    if (typeof name !== 'undefined') {
                        if (typeof file !== 'undefined') {
                            if (name === data[i].name) {
                                found = true;
                                _result.data = data[i];
                                _result.score = 2;
                            }
                        } else {
                            if (name === data[i].name) {
                                found = true;
                                _result.data = data[i];
                                _result.score = 2;
                            }
                        }
                    }
                }
                if (!found) {
                    _result = {
                        source: 'internal',
                        data: undefined,
                        score: 0
                    };
                }
            }
        }
        return _result;
    }

    private manageDuplicatesName() {
        const processDuplicates = (element, index, array) => {
            const elementsWithSameName = array.filter(el => (el as any).name === (element as any).name);
            if (elementsWithSameName.length > 1) {
                // First element is the reference for duplicates
                for (let i = 1; i < elementsWithSameName.length; i++) {
                    const elementToEdit = elementsWithSameName[i];
                    if (typeof elementToEdit.isDuplicate === 'undefined') {
                        elementToEdit.isDuplicate = true;
                        elementToEdit.duplicateId = i;
                        elementToEdit.duplicateName =
                            elementToEdit.name + '-' + elementToEdit.duplicateId;
                        elementToEdit.id = elementToEdit.id + '-' + elementToEdit.duplicateId;
                    }
                }
            }
            return element;
        };
        this.classes = this.classes.map(processDuplicates);
        this.interfaces = this.interfaces.map(processDuplicates);
        this.injectables = this.injectables.map(processDuplicates);
        this.pipes = this.pipes.map(processDuplicates);
        this.interceptors = this.interceptors.map(processDuplicates);
        this.guards = this.guards.map(processDuplicates);
        this.modules = this.modules.map(processDuplicates);
        this.components = this.components.map(processDuplicates);
        this.entities = this.entities.map(processDuplicates);
        this.directives = this.directives.map(processDuplicates);
    }

    public find(name: string): IApiSourceResult<any> | undefined {
        const searchFunctions: Array<() => IApiSourceResult<any>> = [
            () => this.findInCompodocDependencies(name, this.modules),
            () => this.findInCompodocDependencies(name, this.injectables),
            () => this.findInCompodocDependencies(name, this.interceptors),
            () => this.findInCompodocDependencies(name, this.guards),
            () => this.findInCompodocDependencies(name, this.interfaces),
            () => this.findInCompodocDependencies(name, this.classes),
            () => this.findInCompodocDependencies(name, this.components),
            () => this.findInCompodocDependencies(name, this.entities),
            () => this.findInCompodocDependencies(name, this.directives),
            () => this.findInCompodocDependencies(name, this.miscellaneous.variables),
            () => this.findInCompodocDependencies(name, this.miscellaneous.functions),
            () => this.findInCompodocDependencies(name, this.miscellaneous.typealiases),
            () => this.findInCompodocDependencies(name, this.miscellaneous.enumerations),
            () => AngularApiUtil.findApi(name)
        ];

        let bestScore = 0;
        let bestResult = undefined;

        for (const searchFunction of searchFunctions) {
            const result = searchFunction();

            if (result.data && result.score > bestScore) {
                bestScore = result.score;
                bestResult = result;
            }
        }

        return bestResult;
    }

    public update(updatedData): void {
        if (updatedData.modules.length > 0) {
            updatedData.modules.forEach((module: IModuleDep) => {
                const _index = this.modules.findIndex(m => (m as any).name === module.name);
                this.modules[_index] = module;
            });
        }
        if (updatedData.components.length > 0) {
            updatedData.components.forEach((component: IComponentDep) => {
                const _index = this.components.findIndex(c => (c as any).name === component.name);
                this.components[_index] = component;
            });
        }
        if (updatedData.entities.length > 0) {
            updatedData.entities.forEach((entity: any) => {
                const _index = this.entities.findIndex(e => (e as any).name === entity.name);
                this.entities[_index] = entity;
            });
        }
        if (updatedData.directives.length > 0) {
            updatedData.directives.forEach((directive: IDirectiveDep) => {
                const _index = this.directives.findIndex(d => (d as any).name === directive.name);
                this.directives[_index] = directive;
            });
        }
        if (updatedData.injectables.length > 0) {
            updatedData.injectables.forEach((injectable: IInjectableDep) => {
                const _index = this.injectables.findIndex(i => (i as any).name === injectable.name);
                this.injectables[_index] = injectable;
            });
        }
        if (updatedData.interceptors.length > 0) {
            updatedData.interceptors.forEach((interceptor: IInterceptorDep) => {
                const _index = this.interceptors.findIndex(i => (i as any).name === interceptor.name);
                this.interceptors[_index] = interceptor;
            });
        }
        if (updatedData.guards.length > 0) {
            updatedData.guards.forEach((guard: IGuardDep) => {
                const _index = this.guards.findIndex(g => (g as any).name === guard.name);
                this.guards[_index] = guard;
            });
        }
        if (updatedData.interfaces.length > 0) {
            updatedData.interfaces.forEach((int: IInterfaceDep) => {
                const _index = this.interfaces.findIndex(i => (i as any).name === int.name);
                this.interfaces[_index] = int;
            });
        }
        if (updatedData.pipes.length > 0) {
            updatedData.pipes.forEach((pipe: IPipeDep) => {
                const _index = this.pipes.findIndex(p => (p as any).name === pipe.name);
                this.pipes[_index] = pipe;
            });
        }
        if (updatedData.classes.length > 0) {
            updatedData.classes.forEach((classe: any) => {
                const _index = this.classes.findIndex(c => (c as any).name === classe.name);
                this.classes[_index] = classe;
            });
        }
        /**
         * Miscellaneous update
         */
        if (updatedData.miscellaneous.variables.length > 0) {
            updatedData.miscellaneous.variables.forEach((variable: any) => {
                const _index = this.miscellaneous.variables.findIndex(v =>
                    v.name === variable.name && v.file === variable.file
                );
                this.miscellaneous.variables[_index] = variable;
            });
        }
        if (updatedData.miscellaneous.functions.length > 0) {
            updatedData.miscellaneous.functions.forEach((func: IFunctionDecDep) => {
                const _index = this.miscellaneous.functions.findIndex(f =>
                    f.name === func.name && f.file === func.file
                );
                this.miscellaneous.functions[_index] = func;
            });
        }
        if (updatedData.miscellaneous.typealiases.length > 0) {
            updatedData.miscellaneous.typealiases.forEach((typealias: ITypeAliasDecDep) => {
                const _index = this.miscellaneous.typealiases.findIndex(t =>
                    t.name === typealias.name && t.file === typealias.file
                );
                this.miscellaneous.typealiases[_index] = typealias;
            });
        }
        if (updatedData.miscellaneous.enumerations.length > 0) {
            updatedData.miscellaneous.enumerations.forEach((enumeration: IEnumDecDep) => {
                const _index = this.miscellaneous.enumerations.findIndex(e =>
                    e.name === enumeration.name && e.file === enumeration.file
                );
                this.miscellaneous.enumerations[_index] = enumeration;
            });
        }
        this.prepareMiscellaneous();
    }

    public findInCompodoc(name: string) {
        const mergedData = [
            ...this.modules,
            ...this.components,
            ...this.entities,
            ...this.directives,
            ...this.injectables,
            ...this.interceptors,
            ...this.guards,
            ...this.interfaces,
            ...this.pipes,
            ...this.classes,
            ...this.miscellaneous.enumerations,
            ...this.miscellaneous.typealiases,
            ...this.miscellaneous.variables,
            ...this.miscellaneous.functions
        ];
        const result = mergedData.find(el => (el as any).name === name);
        return result || false;
    }

    private prepareMiscellaneous() {
        this.miscellaneous.variables.sort(getNamesCompareFn());
        this.miscellaneous.functions.sort(getNamesCompareFn());
        this.miscellaneous.enumerations.sort(getNamesCompareFn());
        this.miscellaneous.typealiases.sort(getNamesCompareFn());
        // group each subgoup by file
        this.miscellaneous.groupedVariables = this.miscellaneous.variables.reduce((groups, item) => { (groups[item.file] ??= []).push(item); return groups; }, {});
        this.miscellaneous.groupedFunctions = this.miscellaneous.functions.reduce((groups, item) => { (groups[item.file] ??= []).push(item); return groups; }, {});
        this.miscellaneous.groupedEnumerations = this.miscellaneous.enumerations.reduce((groups, item) => { (groups[item.file] ??= []).push(item); return groups; }, {});
        this.miscellaneous.groupedTypeAliases = this.miscellaneous.typealiases.reduce((groups, item) => { (groups[item.file] ??= []).push(item); return groups; }, {});
    }

    private groupByStrategy(items: any[], strategy: string): Record<string, any[]> {
        if (strategy === 'none' || !strategy) return {};

        if (strategy === 'category') {
            const hasAnyCategory = items.some(item => item.category && item.category !== '');
            if (!hasAnyCategory) return {};
            return items.reduce((groups, item) => {
                const k = item.category || '';
                (groups[k] ??= []).push(item);
                return groups;
            }, {} as Record<string, any[]>);
        }

        // strategy === 'folder'
        const groups: Record<string, any[]> = {};
        for (const item of items) {
            // Explicit @category always wins
            if (item.category && item.category !== '') {
                (groups[item.category] ??= []).push(item);
                continue;
            }
            const key = deriveGroupKey(item.file);
            if (key) {
                (groups[key] ??= []).push(item);
            }
        }

        return Object.keys(groups).length > 0 ? groups : {};
    }

    private prepareCategoryGroups() {
        const strategy = Configuration.mainData.groupBy;
        this.categorizedComponents = this.groupByStrategy(this.components as any[], strategy);
        this.categorizedDirectives = this.groupByStrategy(this.directives as any[], strategy);
        this.categorizedInjectables = this.groupByStrategy(this.injectables as any[], strategy);
        this.categorizedPipes = this.groupByStrategy(this.pipes as any[], strategy);
        this.categorizedClasses = this.groupByStrategy(this.classes as any[], strategy);
        this.categorizedInterfaces = this.groupByStrategy(this.interfaces as any[], strategy);
        this.categorizedGuards = this.groupByStrategy(this.guards as any[], strategy);
        this.categorizedInterceptors = this.groupByStrategy(this.interceptors as any[], strategy);
        this.categorizedEntities = this.groupByStrategy(this.entities as any[], strategy);
    }

    public getModule(name: string) {
        return this.modules.find(m => (m as any).name === name);
    }

    public getRawModule(name: string): any {
        return this.rawModules.find(m => (m as any).name === name);
    }

    public getModules() {
        return this.modules;
    }

    public getComponents() {
        return this.components;
    }

    public getEntities() {
        return this.entities;
    }

    public getDirectives() {
        return this.directives;
    }

    public getInjectables() {
        return this.injectables;
    }

    public getInterceptors() {
        return this.interceptors;
    }

    public getGuards() {
        return this.guards;
    }

    public getInterfaces() {
        return this.interfaces;
    }

    public getRoutes() {
        return this.routes;
    }

    public getPipes() {
        return this.pipes;
    }

    public getClasses() {
        return this.classes;
    }

    public getMiscellaneous() {
        return this.miscellaneous;
    }

    /**
     * Compute relationships for a given entity.
     * Returns incoming (who uses this) and outgoing (what it depends on).
     * Limited to MAX_NODES to avoid performance issues in large projects.
     */
    public getRelationships(entityName: string): { incoming: Array<{ name: string; type: string }>; outgoing: Array<{ name: string; type: string }> } {
        const MAX_NODES = 50;
        const incoming: Array<{ name: string; type: string }> = [];
        const outgoing: Array<{ name: string; type: string }> = [];
        const seen = new Set<string>();

        // Check module declarations/imports for relationships
        this.modules.forEach((mod: any) => {
            const modDeclares = (mod.declarations ?? []).map((d: any) => d.name);
            const modImports = (mod.imports ?? []).map((i: any) => i.name);
            const modExports = (mod.exports ?? []).map((e: any) => e.name);

            if (modDeclares.includes(entityName) || modImports.includes(entityName) || modExports.includes(entityName)) {
                if (!seen.has(mod.name) && incoming.length < MAX_NODES) {
                    incoming.push({ name: mod.name, type: 'module' });
                    seen.add(mod.name);
                }
            }
        });

        // Check standalone component imports
        const allComponents = [...this.components, ...this.directives, ...this.pipes] as any[];
        allComponents.forEach((comp: any) => {
            if (comp.name === entityName) {
                // Outgoing: what this entity imports
                (comp.imports ?? []).forEach((imp: any) => {
                    if (!seen.has(imp.name) && outgoing.length < MAX_NODES) {
                        outgoing.push({ name: imp.name, type: imp.type || 'dependency' });
                        seen.add(imp.name);
                    }
                });
                // Outgoing: providers
                (comp.providers ?? []).forEach((prov: any) => {
                    if (!seen.has(prov.name) && outgoing.length < MAX_NODES) {
                        outgoing.push({ name: prov.name, type: 'provider' });
                        seen.add(prov.name);
                    }
                });
            } else {
                // Incoming: other components that import this entity
                const compImports = (comp.imports ?? []).map((i: any) => i.name);
                if (compImports.includes(entityName) && !seen.has(comp.name) && incoming.length < MAX_NODES) {
                    incoming.push({ name: comp.name, type: comp.type || 'component' });
                    seen.add(comp.name);
                }
            }
        });

        return { incoming, outgoing };
    }
}

export default DependenciesEngine.getInstance();
