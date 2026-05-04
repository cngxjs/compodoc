import Html from '@kitajs/html';
import { renderCustomTemplate } from '../../app/engines/custom-template.engine';
import { highlightCode } from '../../app/engines/syntax-highlight.engine';
import { markedAcl } from '../../utils/marked.acl';
import type { ThemeFile } from '../../utils/theme-file-scanner';
import { t } from '../helpers';

type BlockThemingProps = {
    readonly themeFiles: ThemeFile[];
    readonly depth?: number;
};

export const slugifyThemeFileName = (name: string): string =>
    name
        .toLowerCase()
        .replace(/[-._]+/g, '-')
        .replace(/^-+|-+$/g, '');

const renderFileBody = (file: ThemeFile): string => {
    if (file.language === 'md') {
        return `<div class="cdx-prose">${markedAcl(file.content) as string}</div>`;
    }
    return highlightCode(file.content, { lang: file.language, mode: 'snippet' });
};

export const BlockTheming = (props: BlockThemingProps): string => {
    const custom = renderCustomTemplate('block-theming', props);
    if (custom !== null) {
        return custom;
    }

    const files = props.themeFiles ?? [];

    return (
        <section data-compodoc="block-theming">
            <h3 id="theming">
                {t('theming')}
                <a class="cdx-member-permalink" href="#theming">
                    #
                </a>
            </h3>
            {files.map((file: ThemeFile) => {
                const fileCustom = renderCustomTemplate('block-theming-file', {
                    file,
                    depth: props.depth
                });
                if (fileCustom !== null) {
                    return fileCustom;
                }
                const slug = slugifyThemeFileName(file.name);
                return (
                    <section class="cdx-theming-file" data-compodoc="block-theming-file" id={slug}>
                        <h4>
                            {file.name}
                            <a class="cdx-member-permalink" href={`#${slug}`}>
                                #
                            </a>
                        </h4>
                        {renderFileBody(file)}
                    </section>
                );
            })}
        </section>
    );
};
