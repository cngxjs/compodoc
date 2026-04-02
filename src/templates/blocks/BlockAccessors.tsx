import Html from '@kitajs/html';
import {
    extractJsdocCodeExamples,
    functionSignature,
    hasJsdocParams,
    isTabEnabled,
    jsdocReturnsComment,
    linkTypeHtml,
    parseDescription,
    t,
} from '../helpers';
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
        <tr>
            <td class="col-md-4">
                <span class="accessor"><b>{props.label}</b><code>{functionSignature(sig)}</code></span>
            </td>
        </tr>
        {sig.line && isTabEnabled(props.navTabs, 'source') && (
            <tr>
                <td class="col-md-4">
                    <div class="io-line">{t('defined-in')} <a href="" data-line={String(sig.line)} class="link-to-prism">{props.file}:{sig.line}</a></div>
                </td>
            </tr>
        )}
        {(sig.description || sig.jsdoctags || sig.returnType) && (
            <tr>
                <td class="col-md-4">
                    {sig.description && (
                        <div class="io-description">{parseDescription(sig.description, props.depth)}</div>
                    )}
                    {sig.jsdoctags && hasJsdocParams(sig.jsdoctags) && (
                        <div class="io-description">
                            {ParamsTable({ jsdocTags: sig.jsdoctags, depth: props.depth, showOptional: true })}
                        </div>
                    )}
                    {sig.jsdoctags && (() => {
                        const examples = extractJsdocCodeExamples(sig.jsdoctags);
                        if (examples.length === 0) return '';
                        return (
                            <div>
                                <b>{t('example')} :</b>
                                {examples.map(ex => <div>{ex.comment}</div>)}
                            </div>
                        );
                    })()}
                    {sig.returnType && (<>
                        <div class="io-description">
                            <b>{t('returns')} : </b>{linkTypeHtml(sig.returnType)}
                        </div>
                        {sig.jsdoctags && (
                            <div class="io-description">{jsdocReturnsComment(sig.jsdoctags)}</div>
                        )}
                    </>)}
                </td>
            </tr>
        )}
    </>) as string;
};

export const BlockAccessors = (props: BlockAccessorsProps): string => (
    <section data-compodoc="block-accessors">
        <h3 id="accessors">{t('accessors')}</h3>
        {Object.entries(props.accessors).map(([key, acc]) => (
            <table class="table table-sm table-bordered">
                <tbody>
                    <tr>
                        <td class="col-md-4">
                            <span id={key}></span>
                            <span class="name"><b>{key}</b><a href={`#${key}`}><span class="icon ion-ios-link"></span></a></span>
                        </td>
                    </tr>
                    {SignatureBlock({ label: 'get', sig: acc.getSignature, file: props.file, depth: props.depth ?? 0, navTabs: props.navTabs })}
                    {SignatureBlock({ label: 'set', sig: acc.setSignature, file: props.file, depth: props.depth ?? 0, navTabs: props.navTabs })}
                </tbody>
            </table>
        ))}
    </section>
) as string;
