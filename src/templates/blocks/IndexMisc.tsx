import Html from '@kitajs/html';
import { shortPath, t } from '../helpers';

type MiscItem = {
    readonly name: string;
    readonly file: string;
    readonly deprecated?: boolean;
};

type MiscKind = 'function' | 'variable' | 'typealias' | 'enum';

type IndexMiscProps = {
    readonly list: MiscItem[];
    readonly kind: MiscKind;
};

const INDICATOR_LETTERS: Record<MiscKind, string> = {
    function: 'F',
    variable: 'V',
    typealias: 'T',
    enum: 'E',
};

export const IndexMisc = (props: IndexMiscProps): string => {
    const letter = INDICATOR_LETTERS[props.kind];
    const sorted = [...props.list].sort((a, b) => a.name.localeCompare(b.name));

    return (
        <section data-compodoc="block-index" style="margin-top:1.5rem">
            <h3 id="index" class="cdx-section-heading" style="margin-top:0;padding-top:0;border-top:none">{t('index')}</h3>

            <div class="cdx-misc-filter">
                <input type="text" class="cdx-coverage-filter-input"
                    placeholder={t('filter-entities') || 'Filter entities...'}
                    aria-label={t('filter-coverage-results') || 'Filter entities'}
                    data-cdx-misc-filter />
                <button type="button" class="cdx-coverage-filter-clear"
                    aria-label="Clear filter" data-cdx-misc-filter-clear>&times;</button>
            </div>

            <div class="cdx-index">
                <div class="cdx-index-entries">
                    {sorted.map(item => (
                        <a href={`#${item.name}`}
                            class={`cdx-index-entry${item.deprecated ? ' cdx-index-entry--deprecated' : ''}`}
                            title={shortPath(item.file)}
                            data-cdx-misc-name={item.name.toLowerCase()}>
                            <span class={`cdx-index-indicator cdx-index-indicator--${props.kind}`}
                                aria-hidden="true">{letter}</span>
                            <span class="cdx-index-name">{item.name}</span>
                        </a>
                    ))}
                </div>
                <div class="cdx-coverage-no-results" data-cdx-misc-no-results>
                    {t('no-matching-entities') || 'No matching entities'}
                </div>
            </div>
        </section>
    ) as string;
};
