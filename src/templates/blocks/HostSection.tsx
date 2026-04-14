import Html from "@kitajs/html";
import { t } from "../helpers";

/** Standalone section for host configuration (hostStructured) as grouped table. */
export const HostSection = (entries: any[]): string => {
    if (!entries?.length) {
        return "";
    }
    // Filter bare class-only
    const meaningful = entries.filter(
        (e: any) =>
            !(e.kind === "static" && e.key === "class" && entries.length === 1),
    );
    if (meaningful.length === 0) {
        return "";
    }

    const esc = (s: string) =>
        s.replaceAll(
            /[&<>]/g,
            (c: string) =>
                ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[c] as string,
        );

    // Group by category
    const staticClass = meaningful.filter(
        (e: any) => e.kind === "static" && e.key === "class",
    );
    const staticAttrs = meaningful.filter(
        (e: any) => e.kind === "static" && e.key !== "class",
    );
    const boundAttrs = meaningful.filter(
        (e: any) => e.kind === "attr-binding" || e.kind === "property-binding",
    );
    const boundClasses = meaningful.filter(
        (e: any) => e.kind === "class-binding",
    );
    const boundStyles = meaningful.filter(
        (e: any) => e.kind === "style-binding",
    );
    const events = meaningful.filter((e: any) => e.kind === "event");

    // Strip decorator brackets/parens from keys
    const stripKey = (key: string): string => {
        if (key.startsWith("(") && key.endsWith(")")) {
            return key.slice(1, -1);
        }
        if (key.startsWith("[class.") && key.endsWith("]")) {
            return key.slice(7, -1);
        }
        if (key.startsWith("[style.") && key.endsWith("]")) {
            return key.slice(7, -1);
        }
        return key;
    };

    // Link to member identifier, strip ($event) etc from display
    const linkedRef = (value: string): string => {
        const m = /^(this\.)?([a-zA-Z_$][a-zA-Z0-9_$]*)(\(.*\))?$/.exec(value);
        if (!m) {
            return `<code>${esc(value)}</code>`;
        }
        const id = m[2];
        return `<a href="#${id}">${esc(id)}</a>`;
    };

    const renderChip = (key: string, arrow: string, value: string): string =>
        `<span class="cdx-host-chip">${esc(stripKey(key))} ${arrow} ${linkedRef(value)}</span>`;

    const rows: string[] = [];
    const addRow = (label: string, content: string) => {
        rows.push(
            `<div class="cdx-metadata-row"><dt class="cdx-metadata-label">${label}</dt><dd class="cdx-metadata-value">${content}</dd></div>`,
        );
    };

    if (staticClass.length > 0) {
        addRow("Class", `<code>${esc(staticClass[0].value)}</code>`);
    }
    // Merge static attrs + bound attrs into one "Static attributes" group
    const allStaticAttrs = [...staticAttrs, ...boundAttrs];
    if (allStaticAttrs.length > 0) {
        const pairs = allStaticAttrs.map(
            (e: any) =>
                `<div class="cdx-host-attr-pair"><code>${esc(e.key)}</code><span class="cdx-host-val">${esc(e.value)}</span></div>`,
        );
        addRow(
            "Static attributes",
            `<div class="cdx-host-attr-grid">${pairs.join("")}</div>`,
        );
    }
    if (boundClasses.length > 0) {
        const chips = boundClasses.map((e: any) =>
            renderChip(e.key, "\u2190", e.value),
        );
        addRow("Bound classes", chips.join(" "));
    }
    if (boundStyles.length > 0) {
        const chips = boundStyles.map((e: any) =>
            renderChip(e.key, "\u2190", e.value),
        );
        addRow("Bound styles", chips.join(" "));
    }
    if (events.length > 0) {
        const chips = events.map((e: any) =>
            renderChip(e.key, "\u2192", e.value),
        );
        addRow("Listeners", chips.join(" "));
    }

    if (rows.length === 0) {
        return "";
    }

    return (
        <section class="cdx-content-section" data-compodoc="block-host">
            <h3 class="cdx-section-heading" id="host">
                {t("host")}
                <a class="cdx-member-permalink" href="#host">
                    #
                </a>
            </h3>
            <dl class="cdx-metadata-card">{rows.join("")}</dl>
        </section>
    ) as string;
};
