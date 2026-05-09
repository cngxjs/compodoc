export interface NgAddSchema {
    /**
     * Skip detection and migration of legacy `@compodoc/compodoc` artefacts in `package.json`.
     */
    skipMigration?: boolean;

    /**
     * Angular CLI project name when `angular.json` defines multiple projects. Required for
     * multi-project workspaces; ignored when only a single project (or no `angular.json`)
     * is present.
     */
    project?: string;

    /**
     * Prefix used for the generated `package.json` scripts (default: `compodocx`).
     * Must match `[a-z][a-z0-9-]*`.
     */
    scriptPrefix?: string;
}
