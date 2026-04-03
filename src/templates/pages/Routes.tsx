import Html from '@kitajs/html';
import { relativeUrl, t } from '../helpers';

type RoutesProps = {
    readonly depth: number;
};

export const Routes = (props: RoutesProps): string => {
    const base = relativeUrl(props.depth);
    return (<>
        <ol class="cdx-breadcrumb">
            <li class="">{t('routes')}</li>
        </ol>

        <div id="body-routes"></div>

        <script src={`${base}js/routes/routes_index.js`}></script>
    </>) as string;
};
