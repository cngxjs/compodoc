export const RouterUtils = {
    getLazyModule: () => () => import('./lazy/lazy.module').then(m => m.LazyModule),
    config: {
        pathMatch: 'full'
    },
    titles: {
        dashboard: 'Dashboard',
        home: 'Home'
    },
    breadcrumbs: {
        main: 'Main Navigation'
    },
    matcher: {
        full: 'full',
        prefix: 'prefix'
    }
};
