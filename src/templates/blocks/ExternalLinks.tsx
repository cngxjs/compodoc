import Html from '@kitajs/html';
import {
    IconBook,
    IconExternalLink,
    IconFigma,
    IconGithub,
    IconStorybook,
    IconZap
} from '../components/Icons';

type ExternalLinksProps = {
    readonly storybookUrl?: string;
    readonly figmaUrl?: string;
    readonly stackblitzUrl?: string;
    readonly githubUrl?: string;
    readonly docsUrl?: string;
};

type LinkDef = {
    readonly key: keyof ExternalLinksProps;
    readonly label: string;
    readonly icon: () => string;
    readonly kind: string;
};

const LINK_DEFS: readonly LinkDef[] = [
    {
        key: 'storybookUrl',
        label: 'Storybook',
        icon: IconStorybook,
        kind: 'storybook'
    },
    { key: 'figmaUrl', label: 'Figma', icon: IconFigma, kind: 'figma' },
    {
        key: 'stackblitzUrl',
        label: 'StackBlitz',
        icon: IconZap,
        kind: 'stackblitz'
    },
    { key: 'githubUrl', label: 'GitHub', icon: IconGithub, kind: 'github' },
    { key: 'docsUrl', label: 'Docs', icon: IconBook, kind: 'docs' }
];

/**
 * Renders a cluster of external resource links (Storybook, Figma,
 * StackBlitz, GitHub, docs). Returns empty string if nothing is
 * configured. Lives in the entity hero on every page template so the
 * cluster is visible on every tab, not just Info. Route is rendered
 * separately by {@link RouteChip} inside the Info tab description.
 */
export const ExternalLinks = (props: ExternalLinksProps): string => {
    const links = LINK_DEFS.filter(def => !!props[def.key]);
    if (links.length === 0) {
        return '';
    }

    return (
        <div class="cdx-external-links">
            {links.map(def => (
                <a
                    href={props[def.key] as string}
                    target="_blank"
                    rel="noopener noreferrer"
                    class={`cdx-ext-link cdx-ext-link--${def.kind}`}
                    title={`${def.label}: ${props[def.key]}`}
                >
                    <span class="cdx-ext-link-icon">{def.icon()}</span>
                    <span class="cdx-ext-link-label">{def.label}</span>
                    <span class="cdx-ext-link-indicator" aria-hidden="true">
                        {IconExternalLink()}
                    </span>
                </a>
            ))}
        </div>
    ) as string;
};
