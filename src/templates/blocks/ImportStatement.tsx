import Html from '@kitajs/html';
import { t } from '../helpers';
import { resolveImportPath } from '../helpers/import-resolver';

/** Renders the import statement section for an entity's Info tab. */
export const ImportStatement = (props: { name: string; file: string }): string => {
    const importPath = resolveImportPath(props.file);
    if (!importPath) {
        return '';
    }

    return (
        <section class="cdx-content-section">
            <h3 class="cdx-section-heading" id="import">
                {t('import')}
                <a class="cdx-member-permalink" href="#import">
                    #
                </a>
            </h3>
            <p class="cdx-import-line">
                <span class="cdx-import-kw">import</span>
                {' { '}
                <span class="cdx-import-name">{props.name}</span>
                {' } '}
                <span class="cdx-import-kw">from</span>{' '}
                <span class="cdx-import-str">'{importPath}'</span>
            </p>
        </section>
    ) as string;
};
