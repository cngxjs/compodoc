import Html from '@kitajs/html';
import {
    functionSignature,
    hasJsdocParams,
    isTabEnabled,
    jsdocReturnsComment,
    linkTypeHtml,
    parseDescription,
    t,
} from '../helpers';
import { JsdocExamplesBlock } from './JsdocExamplesBlock';
import { ParamsTable } from './ParamsTable';

type BlockAccessorsProps = {
    readonly accessors: Record<string, any>;
    readonly file: string;
    readonly depth?: number;
    readonly navTabs?: any[];
};

const SignatureBlock = (props: {
    label: string;
    sig: any;
    file: string;
    depth: number;
    navTabs?: any[];
}): string => {
    const sig = props.sig;
    if (!sig) return '';
    return (<>
        <div class="cdx-member-row">
            <span class="accessor"><b>{props.label}</b><code>{functionSignature(sig)}</code></span>
        </div>
        {sig.line && isTabEnabled(props.navTabs, 'source') && (
            <div class="cdx-member-row">
                {t('defined-in')} <a href="" data-cdx-line={String(sig.line)} class="cdx-link-to-source">{props.file}:{sig.line}</a>
            </div>
        )}
        {sig.description && (
            <div class="io-description">{parseDescription(sig.description, props.depth)}</div>
        )}
        {sig.jsdoctags && hasJsdocParams(sig.jsdoctags) && (
            <div class="io-description">
                {ParamsTable({ jsdocTags: sig.jsdoctags, depth: props.depth, showOptional: true })}
            </div>
        )}
        {sig.jsdoctags && JsdocExamplesBlock({ tags: sig.jsdoctags, variant: 'code' })}
        {sig.returnType && (<>
            <div class="cdx-member-returns">
                <b>{t('returns')} : </b>{linkTypeHtml(sig.returnType)}
            </div>
            {sig.jsdoctags && (
                <div class="io-description">{jsdocReturnsComment(sig.jsdoctags)}</div>
            )}
        </>)}
    </>) as string;
};

export const BlockAccessors = (props: BlockAccessorsProps): string => {
    return (
        <section data-compodoc="block-accessors">
            <h3 id="accessors">{t('accessors')}</h3>
            {Object.entries(props.accessors).map(([key, acc]) => (
                <article class="cdx-member-card" id={key}>

                    <header class="cdx-member-header">
                        <span class="cdx-member-name">
                            <span class="cdx-member-name-text">{key}</span>
                            <a href={`#${key}`} class="cdx-member-permalink" aria-label={`Link to ${key}`}>#</a>
                        </span>
                    </header>
                    <div class="cdx-member-body">
                        {SignatureBlock({ label: 'get', sig: acc.getSignature, file: props.file, depth: props.depth ?? 0, navTabs: props.navTabs })}
                        {SignatureBlock({ label: 'set', sig: acc.setSignature, file: props.file, depth: props.depth ?? 0, navTabs: props.navTabs })}
                    </div>
                </article>
            ))}
        </section>
    ) as string;
};
