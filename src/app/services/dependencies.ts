import { AngularDependencies } from '../compiler/angular-dependencies';

export interface CrawlerConfig {
    readonly tsconfigDirectory: string;
}

export type DependenciesData = ReturnType<AngularDependencies['getDependencies']>;

export function crawlDependencies(
    files: ReadonlyArray<string>,
    cfg: CrawlerConfig
): DependenciesData {
    const crawler = new AngularDependencies([...files], {
        tsconfigDirectory: cfg.tsconfigDirectory
    });
    return crawler.getDependencies();
}

export function crawlMicroDependencies(
    updatedFiles: ReadonlyArray<string>,
    cfg: CrawlerConfig
): DependenciesData {
    const crawler = new AngularDependencies([...updatedFiles], {
        tsconfigDirectory: cfg.tsconfigDirectory
    });
    return crawler.getDependencies();
}
