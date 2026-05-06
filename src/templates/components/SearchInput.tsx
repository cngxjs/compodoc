import Html from '@kitajs/html';
import { t } from '../helpers';

export const SearchInput = (): string =>
    (
        <search id="book-search-input">
            <input type="text" placeholder={t('search-placeholder')} readonly />
            <kbd class="cdx-search-shortcut">
                <span class="cdx-cdx-search-shortcut-key">{'\u2318'}K</span>
            </kbd>
        </search>
    ) as string;
