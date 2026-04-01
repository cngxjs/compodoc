import Html from '@kitajs/html';
import { t } from '../helpers';

export const SearchResults = (): string => (
    <div class="search-results">
        <div class="has-results">
            <h1 class="search-results-title">
                <span class="search-results-count"></span> {t('results-matching')} "<span class="search-query"></span>"
            </h1>
            <ul class="search-results-list"></ul>
        </div>
        <div class="no-results">
            <h1 class="search-results-title">
                {t('no-result-matching')} "<span class="search-query"></span>"
            </h1>
        </div>
    </div>
) as string;
