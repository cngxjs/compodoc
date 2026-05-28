import Html from '@kitajs/html';
import { markedAcl } from '../../utils/marked.acl';
import { t } from '../helpers';

// Side-effect: ensure MarkdownEngine has registered its `renderer` on the
// shared `markedAcl` instance (code-block / table / heading customisations).
// The default export of markdown.engine is the singleton — importing it
// guarantees `getInstance()` has run before we call into marked here.
import '../../app/engines/markdown.engine';

type A11yNoteProps = {
    readonly a11yNote?: string;
};

/**
 * Renders the `@a11y` JSDoc note as a markdown-processed section. Lives
 * above the description on entity Info tabs. Markdown lets authors embed
 * links to WAI-ARIA APG patterns and code samples; mermaid fences pass
 * through once the SSR pipeline lands.
 */
export const A11yNote = (props: A11yNoteProps): string => {
    const note = props.a11yNote?.trim();
    if (!note) {
        return '' as string;
    }
    const html = markedAcl(note);
    return (
        <section class="cdx-a11y-note" aria-labelledby="cdx-a11y-note-heading">
            <h3 class="cdx-section-heading" id="cdx-a11y-note-heading">
                {t('accessibility-notes')}
            </h3>
            <div class="cdx-a11y-note-body cdx-prose">{html}</div>
        </section>
    ) as string;
};
