import Html from "@kitajs/html";
import { renderCustomTemplate } from "../../app/engines/custom-template.engine";
import { highlightCode } from "../../app/engines/syntax-highlight.engine";
import { markedAcl } from "../../utils/marked.acl";
import type {
    StyleSource,
    ThemeToken,
    ThemeTokenGroup,
} from "../../utils/theme-doc-parser";
import { groupThemeTokens } from "../../utils/theme-doc-parser";
import { t } from "../helpers";

type BlockThemingProps = {
    readonly tokens: ThemeToken[];
    readonly styleSources?: StyleSource[];
    /** Markdown intro harvested from `@overview` blocks; rendered above the tables. */
    readonly overview?: string;
    readonly depth?: number;
};

const slugifyId = (raw: string): string =>
    raw
        .replace(/^[$-]+/, "")
        .toLowerCase()
        .replaceAll(/[^a-z0-9]+/g, "-")
        .replaceAll(/^-+|-+$/g, "");

const tokenAnchor = (token: ThemeToken): string =>
    `theme-${slugifyId(token.name)}`;

const renderTokenName = (token: ThemeToken): string => {
    const name = Html.escapeHtml(token.name) as string;
    const wrapped = token.deprecated !== null ? `<s>${name}</s>` : name;
    const badges: string[] = [];
    if (token.since) {
        badges.push(
            `<span class="cdx-badge cdx-badge--since">${Html.escapeHtml(token.since) as string}</span>`,
        );
    }
    if (token.deprecated !== null) {
        const reason = token.deprecated
            ? ` title="${Html.escapeHtml(token.deprecated) as string}"`
            : "";
        badges.push(
            `<span class="cdx-badge cdx-badge--deprecated"${reason}>${
                Html.escapeHtml(t("deprecated")) as string
            }</span>`,
        );
    }
    return `<code class="cdx-shiki-inline cdx-theming-token-name">${wrapped}</code>${badges.join("")}`;
};

const renderTokenDescription = (token: ThemeToken): string => {
    const parts: string[] = [];
    if (token.description) {
        parts.push(
            `<div class="cdx-prose">${markedAcl(token.description) as string}</div>`,
        );
    }
    if (token.deprecated) {
        parts.push(
            `<p class="cdx-theming-deprecated">${markedAcl(token.deprecated) as string}</p>`,
        );
    }
    if (token.examples.length > 0) {
        for (const example of token.examples) {
            const fence = example.match(/^```(\w+)\n([\s\S]*?)\n```$/);
            const lang = fence ? fence[1] : "css";
            const code = fence ? fence[2] : example;
            parts.push(
                `<div class="cdx-theming-example">${highlightCode(code, {
                    lang,
                    mode: "snippet",
                })}</div>`,
            );
        }
    }
    if (token.see.length > 0) {
        const items = token.see
            .map((s) => {
                const escaped = Html.escapeHtml(s) as string;
                if (/^https?:/i.test(s)) {
                    return `<a href="${escaped}" rel="noopener" target="_blank">${escaped}</a>`;
                }
                if (s.startsWith("--") || s.startsWith("$")) {
                    return `<a href="#theme-${slugifyId(s)}"><code>${escaped}</code></a>`;
                }
                return escaped;
            })
            .join(", ");
        parts.push(`<p class="cdx-theming-see">${t("see")}: ${items}</p>`);
    }
    return parts.join("") || "&nbsp;";
};

const renderTokenRow = (token: ThemeToken, depth?: number): string => {
    const custom = renderCustomTemplate("block-theming-token", {
        token,
        depth,
    });
    if (custom !== null) {
        return custom;
    }
    const id = tokenAnchor(token);
    const type = token.type
        ? `<code>${Html.escapeHtml(token.type) as string}</code>`
        : "";
    const def = token.defaultValue
        ? `<code>${Html.escapeHtml(token.defaultValue) as string}</code>`
        : "";
    return (
        `<tr id="${id}" data-compodoc="block-theming-token">` +
        `<td class="cdx-theming-name-cell">${renderTokenName(token)}</td>` +
        `<td class="cdx-theming-type-cell">${type}</td>` +
        `<td class="cdx-theming-default-cell">${def}</td>` +
        `<td class="cdx-theming-desc-cell">${renderTokenDescription(token)}</td>` +
        `</tr>`
    );
};

const renderGroup = (group: ThemeTokenGroup, depth?: number): string => {
    const heading = group.name
        ? `<h4 class="cdx-section-heading" id="theme-group-${slugifyId(group.name)}">${
              Html.escapeHtml(group.name) as string
          }</h4>`
        : "";
    const rows = group.tokens
        .map((token) => renderTokenRow(token, depth))
        .join("");
    return (
        `<section class="cdx-theming-group" data-group="${
            Html.escapeHtml(group.name) as string
        }">` +
        heading +
        `<table class="cdx-theming-tokens cdx-table">` +
        `<thead><tr>` +
        `<th>${t("name")}</th>` +
        `<th>${t("type")}</th>` +
        `<th>${t("default-value")}</th>` +
        `<th>${t("description")}</th>` +
        `</tr></thead>` +
        `<tbody>${rows}</tbody>` +
        `</table>` +
        `</section>`
    );
};

const renderSourcePanel = (sources: StyleSource[]): string => {
    if (!sources || sources.length === 0) {
        return "";
    }
    const items = sources
        .map((src) => {
            const label = src.file.startsWith("<inline-style-")
                ? src.file
                : src.file.split("/").slice(-2).join("/");
            return (
                `<section class="cdx-theming-source-file">` +
                `<h5 class="cdx-theming-source-file-name">${
                    Html.escapeHtml(label) as string
                }</h5>` +
                highlightCode(src.content, {
                    lang: src.language,
                    mode: "snippet",
                }) +
                `</section>`
            );
        })
        .join("");
    return (
        `<details class="cdx-theming-source">` +
        `<summary>${t("source")}</summary>` +
        items +
        `</details>`
    );
};

export const BlockTheming = (props: BlockThemingProps): string => {
    const tokens = props.tokens ?? [];
    const styleSources = props.styleSources ?? [];
    const overview = (props.overview ?? "").trim();
    const groups = groupThemeTokens(tokens);

    const overrideArgs = { groups, styleSources, overview, depth: props.depth };
    const custom = renderCustomTemplate("block-theming", overrideArgs);
    if (custom !== null) {
        return custom;
    }

    const overviewHtml = overview
        ? `<div class="cdx-theming-overview cdx-prose">${markedAcl(overview) as string}</div>`
        : "";

    return (
        <section data-compodoc="block-theming">
            {overviewHtml}
            {groups.map((group) => renderGroup(group, props.depth))}
            {renderSourcePanel(styleSources)}
        </section>
    ) as string;
};
