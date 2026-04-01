import Html from '@kitajs/html';
import { t } from '../helpers';

export const SearchInput = (): string => (
    <div id="book-search-input" role="search">
        <input type="text" placeholder={t('search-placeholder')} />
    </div>
) as string;
