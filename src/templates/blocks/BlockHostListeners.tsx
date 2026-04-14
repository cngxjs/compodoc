import Html from '@kitajs/html';
import { t } from '../helpers';

type BlockHostListenersProps = {
    readonly listeners: any[];
};

export const BlockHostListeners = (props: BlockHostListenersProps): string => {
    if (!props.listeners?.length) {
        return '';
    }

    // Build handler string: argsDecorator has the raw event args like '$event'
    const handlerStr = (m: any): string => {
        const args = (m.argsDecorator ?? []).join(', ');
        return `${m.name}(${args})`;
    };

    return (
        <section data-compodoc="block-host-listeners">
            <h3 id="hostlisteners">{t('hostlisteners')}<a class="cdx-member-permalink" href="#hostlisteners">#</a></h3>
            <table class="cdx-table cdx-host-table">
                <thead>
                    <tr>
                        <th>{t('event')}</th>
                        <th>{t('handler')}</th>
                    </tr>
                </thead>
                <tbody>
                    {props.listeners.map((m: any) => (
                        <tr>
                            <td>
                                <code>({m.name})</code>
                            </td>
                            <td>
                                <code>{handlerStr(m)}</code>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </section>
    ) as string;
};
