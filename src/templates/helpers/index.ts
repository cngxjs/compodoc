export { capitalize } from './capitalize';
export { functionSignature } from './function-signature';
export { indexableSignature } from './indexable-signature';
export {
    extractJsdocCodeExamples,
    extractJsdocExamples,
    extractJsdocParams,
    hasJsdocParams,
    jsdocReturnsComment
} from './jsdoc';
export { linkTypeHtml, resolveType } from './link-type';
export { modifIcon, modifIconFromArray } from './modif-icon';
export { modifKind } from './modif-kind';
export { oneParameterHas } from './one-parameter-has';
export { parseDescription } from './parse-description';
export { parseProperty } from './parse-property';
export { relativeUrl } from './relative-url';
export { shortUrl } from './short-url';
export { isInfoSection, isInitialTab, isTabEnabled } from './tab-helpers';
export { t } from './i18n';

/** Check if a member has private or protected modifiers (SyntaxKind 123 = Private, 124 = Protected). */
export const isInternalMember = (modifierKind?: number[]): boolean =>
    (modifierKind ?? []).some(k => k === 123 || k === 124);

/** A readme that is only a heading (no paragraphs, lists, code blocks) is treated as empty. */
export const isReadmeEmpty = (readme: string | undefined): boolean => {
    if (!readme) return true;
    const stripped = readme
        .replaceAll(/<h[1-6][^>]*>.*?<\/h[1-6]>/gi, '')
        .replaceAll(/<[^>]+>/g, '')
        .trim();
    return stripped.length === 0;
};

/** Extract heading HTML from readme (shown above empty state when readme is heading-only). */
export const extractReadmeHeadings = (readme: string | undefined): string => {
    if (!readme) return '';
    const headings = readme.match(/<h[1-6][^>]*>.*?<\/h[1-6]>/gi);
    return headings ? headings.join('') : '';
};
