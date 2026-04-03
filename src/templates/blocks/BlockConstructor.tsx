import Html from '@kitajs/html';
import {
    extractJsdocExamples,
    functionSignature,
    hasJsdocParams,
    isTabEnabled,
    modifKind,
    parseDescription,
    t,
} from '../helpers';
import { ParamsTable } from './ParamsTable';

type BlockConstructorProps = {
    readonly constructor: any;
    readonly file: string;
    readonly depth?: number;
    readonly navTabs?: any[];
};

export const BlockConstructor = (props: BlockConstructorProps): string => {
    const ctor = props.constructor;
    return (
        <section data-compodoc="block-constructor">
            <h3 id="constructor">{t('constructor')}</h3>
            <article class="cdx-member-card">
                <header class="cdx-member-header">
                    <span class="cdx-member-name">
                        {ctor.modifierKind && ctor.modifierKind.map((k: number) => (
                            <span class="modifier">{modifKind(k)}</span>
                        ))}
                        constructor
                    </span>
                </header>
                <div class="cdx-member-body">
                    <div class="cdx-member-row"><code>{functionSignature(ctor)}</code></div>
                    {ctor.line && isTabEnabled(props.navTabs, 'source') && (
                        <div class="cdx-member-row">
                            {t('defined-in')} <a href="" data-line={String(ctor.line)} class="link-to-prism">{props.file}:{ctor.line}</a>
                        </div>
                    )}
                    {ctor.description && (
                        <div class="io-description">{parseDescription(ctor.description, props.depth ?? 0)}</div>
                    )}
                    {ctor.jsdoctags && hasJsdocParams(ctor.jsdoctags) && (
                        <div>
                            {ParamsTable({ jsdocTags: ctor.jsdoctags, depth: props.depth ?? 0, showOptional: true })}
                            {(() => {
                                const examples = extractJsdocExamples(ctor.jsdoctags);
                                if (examples.length === 0) return '';
                                return (<>
                                    <b>{t('example')} :</b>
                                    {examples.map(ex => <div>{ex.comment}</div>)}
                                </>);
                            })()}
                        </div>
                    )}
                </div>
            </article>
        </section>
    ) as string;
};
