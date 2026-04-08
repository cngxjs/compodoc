import Html from '@kitajs/html';
import {
    functionSignature,
    hasJsdocParams,
    isTabEnabled,
    modifKind,
    parseDescription,
    t,
} from '../helpers';
import { JsdocExamplesBlock } from './JsdocExamplesBlock';
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
                <div class="cdx-member-body" style="border-top: none; padding-top: 16px;">
                    {ctor.modifierKind && ctor.modifierKind.length > 0 && (
                        <div class="cdx-member-row">
                            {ctor.modifierKind.map((k: number) => (
                                <span class="modifier">{modifKind(k)}</span>
                            ))}
                        </div>
                    )}
                    <div class="cdx-member-signature">
                        <code>{functionSignature(ctor)}</code>
                    </div>
                    {ctor.line && isTabEnabled(props.navTabs, 'source') && (
                        <div class="cdx-member-row">
                            {t('defined-in')} <a href="" data-cdx-line={String(ctor.line)} class="cdx-link-to-source">{props.file}:{ctor.line}</a>
                        </div>
                    )}
                    {ctor.description && (
                        <div class="io-description">{parseDescription(ctor.description, props.depth ?? 0)}</div>
                    )}
                    {ctor.jsdoctags && hasJsdocParams(ctor.jsdoctags) && (
                        <div>
                            {ParamsTable({ jsdocTags: ctor.jsdoctags, depth: props.depth ?? 0, showOptional: true })}
                            {JsdocExamplesBlock({ tags: ctor.jsdoctags, variant: 'text' })}
                        </div>
                    )}
                </div>
            </article>
        </section>
    ) as string;
};
