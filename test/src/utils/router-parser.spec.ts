import { describe, expect, it } from 'vitest';
import RouterParserUtilFromIndex, {
    RouterParserUtil as RouterParserUtilFromIndexNamed
} from '../../../src/utils/router-parser/index';
import { ModuleLinker } from '../../../src/utils/router-parser/module-linker';
import { RawRouteCleaner } from '../../../src/utils/router-parser/raw-route-cleaner';
import { RouteStore } from '../../../src/utils/router-parser/route-store';
import { RoutesTreeBuilder } from '../../../src/utils/router-parser/routes-tree-builder';
import { SourceFileCleaner } from '../../../src/utils/router-parser/source-file-cleaner';
import RouterParserUtilFromShim, {
    RouterParserUtil as RouterParserUtilFromShimNamed
} from '../../../src/utils/router-parser.util';

describe('router-parser — orchestrator wiring', () => {
    it('shim re-exports the same default singleton instance as the index module', () => {
        expect(RouterParserUtilFromShim).toBe(RouterParserUtilFromIndex);
    });

    it('shim re-exports the same RouterParserUtil class as the index module', () => {
        expect(RouterParserUtilFromShimNamed).toBe(RouterParserUtilFromIndexNamed);
    });

    it('default export is the singleton — getInstance() returns the same object', () => {
        expect(RouterParserUtilFromShimNamed.getInstance()).toBe(RouterParserUtilFromShim);
    });

    it('each concern-scoped helper is a constructible class', () => {
        const routeStore = new RouteStore();
        expect(routeStore).toBeInstanceOf(RouteStore);
        expect(new RawRouteCleaner()).toBeInstanceOf(RawRouteCleaner);
        expect(new ModuleLinker(routeStore)).toBeInstanceOf(ModuleLinker);
        expect(new RoutesTreeBuilder(routeStore)).toBeInstanceOf(RoutesTreeBuilder);
        expect(new SourceFileCleaner(routeStore)).toBeInstanceOf(SourceFileCleaner);
    });

    it('RouteStore.foundLazyModuleWithPath splits on # and returns the module name', () => {
        const store = new RouteStore();
        expect(store.foundLazyModuleWithPath('app/x/x.module#XModule')).toBe('XModule');
        expect(store.foundLazyComponentWithPath('app/x/x.component#XComponent')).toBe('XComponent');
    });

    it('RawRouteCleaner.cleanRawRoute strips whitespace and trailing commas', () => {
        const cleaner = new RawRouteCleaner();
        const input = '[ { "path": "home", "component": "HomeComponent", }, ]';
        const cleaned = cleaner.cleanRawRoute(input);
        // whitespace stripped
        expect(cleaned).not.toMatch(/\s/);
        // trailing comma before closing bracket removed
        expect(cleaned).not.toMatch(/,]/);
        expect(cleaned).not.toMatch(/,}/);
    });

    it('orchestrator delegates addRoute / foundRouteWithModuleName through RouteStore', () => {
        const instance = RouterParserUtilFromShimNamed.getInstance();
        const initialLength = instance.routesLength();
        instance.addRoute({ name: 'X-test-route', data: '[]', filename: 'x.ts', module: 'XMod' });
        const found = instance.foundRouteWithModuleName('XMod');
        expect(found?.name).toBe('X-test-route');
        // cleanup — singleton state leaks into other tests otherwise
        instance.foundRouteWithModuleName('XMod') &&
            (instance as any).routeStore.routes.splice(
                (instance as any).routeStore.routes.findIndex(
                    (r: any) => r.name === 'X-test-route'
                ),
                1
            );
        expect(instance.routesLength()).toBe(initialLength);
    });
});
