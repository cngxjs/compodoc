import Html from '@kitajs/html';
import { renderCustomTemplate } from '../../app/engines/custom-template.engine';
import { t } from '../helpers';

type BlockHostBindingsProps = {
    readonly bindings: any[];
};

export const BlockHostBindings = (props: BlockHostBindingsProps): string => {
    const custom = renderCustomTemplate('block-host-bindings', props);
    if (custom !== null) {
        return custom;
    }
    if (!props.bindings?.length) {
        return '';
    }

    return (
        <section data-compodoc="block-host-bindings">
            <h3 id="hostbindings">
                {t('hostbindings')}
                <a class="cdx-member-permalink" href="#hostbindings">
                    #
                </a>
            </h3>
            <table class="cdx-table cdx-host-table">
                <thead>
                    <tr>
                        <th>{t('binding')}</th>
                        <th>{t('expression')}</th>
                    </tr>
                </thead>
                <tbody>
                    {props.bindings.map((b: any) => (
                        <tr>
                            <td>
                                <code>[{b.name}]</code>
                            </td>
                            <td>
                                <code>{b.defaultValue}</code>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </section>
    ) as string;
};
