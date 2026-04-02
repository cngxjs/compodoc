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
            <table class="table table-sm table-bordered">
                <tbody>
                    <tr>
                        <td class="col-md-4">
                            {ctor.modifierKind && ctor.modifierKind.map((k: number) => (
                                <span class="modifier">{modifKind(k)}</span>
                            ))}
                            <code>{functionSignature(ctor)}</code>
                        </td>
                    </tr>
                    {ctor.line && isTabEnabled(props.navTabs, 'source') && (
                        <tr>
                            <td class="col-md-4">
                                <div class="io-line">{t('defined-in')} <a href="" data-line={String(ctor.line)} class="link-to-prism">{props.file}:{ctor.line}</a></div>
                            </td>
                        </tr>
                    )}
                    {(ctor.jsdoctags || ctor.description) && (
                        <tr>
                            <td class="col-md-4">
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
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </section>
    ) as string;
};
