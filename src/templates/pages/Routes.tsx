import Html from '@kitajs/html';
import { relativeUrl, t } from '../helpers';

type RoutesProps = {
    readonly depth: number;
};

export const Routes = (props: RoutesProps): string => {
    const base = relativeUrl(props.depth);
    return (<>
        <ol class="breadcrumb">
            <li class="breadcrumb-item">{t('routes')}</li>
        </ol>

        <div id="body-routes"></div>

        <script src={`${base}js/libs/d3.v3.min.js`}></script>
        <script src={`${base}js/libs/innersvg.js`}></script>
        <script src={`${base}js/routes/routes_index.js`}></script>
        <script src={`${base}js/routes.js`}></script>
    </>) as string;
};
