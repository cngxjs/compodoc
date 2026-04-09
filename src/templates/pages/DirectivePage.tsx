import {
    MetadataCodeRow,
    MetadataRow,
    MetadataSection,
} from "../blocks/MetadataRow";
import { isInfoSection, linkTypeHtml, t } from "../helpers";
import { renderEntityPage } from "./EntityPage";

const DirectiveMetadata = (directive: any): string => {
    if (!isInfoSection("metadata")) {
        return "";
    }
    const hasMetadata =
        directive.selector ||
        directive.providers ||
        directive.standalone ||
        directive.hostDirectives ||
        directive.exportAs;
    const hasExtends = directive.extends?.length > 0;
    const hasImplements = directive.implements?.length > 0;
    if (!hasMetadata && !hasExtends && !hasImplements) {
        return "";
    }

    const rows: string[] = [];

    if (directive.selector) {
        rows.push(MetadataCodeRow(t("selector"), directive.selector));
    }
    if (directive.standalone) {
        rows.push(
            MetadataCodeRow(t("standalone"), String(directive.standalone)),
        );
    }
    if (directive.exportAs) {
        rows.push(MetadataCodeRow(t("exportAs"), directive.exportAs));
    }
    if (directive.providers) {
        rows.push(
            MetadataCodeRow(
                t("providers"),
                directive.providers.map((p: any) => p.name).join(", "),
            ),
        );
    }
    if (directive.hostDirectives?.length > 0) {
        rows.push(
            MetadataRow(
                t("hostdirectives"),
                directive.hostDirectives
                    .map((hd: any) => {
                        let html = linkTypeHtml(hd.name);
                        if (hd.inputs?.length > 0) {
                            html += ` <span class="cdx-metadata-label">${t("inputs")}:</span> ${hd.inputs.join(", ")}`;
                        }
                        if (hd.outputs?.length > 0) {
                            html += ` <span class="cdx-metadata-label">${t("outputs")}:</span> ${hd.outputs.join(", ")}`;
                        }
                        return html;
                    })
                    .join(" "),
            ),
        );
    }
    if (hasExtends) {
        rows.push(
            MetadataRow(
                "extends",
                (directive.extends as string[])
                    .map((ext) => linkTypeHtml(ext))
                    .join(" "),
            ),
        );
    }
    if (hasImplements) {
        rows.push(
            MetadataRow(
                "implements",
                (directive.implements as string[])
                    .map((impl) => linkTypeHtml(impl))
                    .join(" "),
            ),
        );
    }

    return MetadataSection({ rows });
};

export const DirectivePage = (data: any): string =>
    renderEntityPage({
        entity: data.directive,
        entityKey: "directive",
        breadcrumbLabel: "directives",
        depth: data.depth,
        navTabs: data.navTabs,
        disableFilePath: data.disableFilePath,
        metadataHtml: DirectiveMetadata(data.directive),
        showExtends: false,
        showIndex: true,
        showConstructor: true,
        showInputs: true,
        showOutputs: true,
        showHostBindings: true,
        showHostListeners: true,
        showMethods: true,
        showProperties: true,
        showAccessors: true,
        contextLine: data.directive?.selector,
        showStandaloneBadge: true,
        showJsdocBadges: true,
        relationships: data.relationships,
        sourceCode: data.directive?.sourceCode,
    });
