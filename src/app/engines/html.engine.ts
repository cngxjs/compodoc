import Handlebars from 'handlebars';
import * as path from 'path';

import { logger } from '../../utils/logger';
import FileEngine from './file.engine';
import { HtmlEngineHelpers } from './html.engine.helpers';
import { Layout } from '../../templates/Layout';
import { SearchInput } from '../../templates/components/SearchInput';
import { SearchResults } from '../../templates/components/SearchResults';
import { Markdown } from '../../templates/pages/Markdown';
import { AdditionalPage } from '../../templates/pages/AdditionalPage';
import { PackageDependencies } from '../../templates/pages/PackageDependencies';
import { PackageProperties } from '../../templates/pages/PackageProperties';
import { Overview } from '../../templates/pages/Overview';
import { Modules } from '../../templates/pages/Modules';
import { Routes } from '../../templates/pages/Routes';
import { CoverageReport } from '../../templates/pages/CoverageReport';
import { UnitTestReport } from '../../templates/pages/UnitTestReport';

/** Map page context to its Handlebars partial name */
const CONTEXT_PARTIAL_MAP: Record<string, string> = {
    'getting-started': 'markdown',
    'readme': 'markdown',
    'changelog': 'markdown',
    'contributing': 'markdown',
    'license': 'markdown',
    'overview': 'overview',
    'modules': 'modules',
    'module': 'module',
    'component': 'component',
    'entity': 'entity',
    'directive': 'directive',
    'injectable': 'injectable',
    'interceptor': 'interceptor',
    'guard': 'guard',
    'pipe': 'pipe',
    'class': 'class',
    'interface': 'interface',
    'routes': 'routes',
    'package-dependencies': 'package-dependencies',
    'package-properties': 'package-properties',
    'miscellaneous-functions': 'miscellaneous-functions',
    'miscellaneous-variables': 'miscellaneous-variables',
    'miscellaneous-typealiases': 'miscellaneous-typealiases',
    'miscellaneous-enumerations': 'miscellaneous-enumerations',
    'coverage': 'coverage-report',
    'unit-test': 'unit-test-report',
    'additional-page': 'additional-page',
};

export class HtmlEngine {
    private compiledPartials: Record<string, HandlebarsTemplateDelegate> = {};
    private compiledMenu: HandlebarsTemplateDelegate | null = null;
    private compiledSearchInput: HandlebarsTemplateDelegate | null = null;
    private compiledSearchResults: HandlebarsTemplateDelegate | null = null;

    private static instance: HtmlEngine;
    private constructor() {
        const helper = new HtmlEngineHelpers();
        helper.registerHelpers(Handlebars);
    }
    public static getInstance() {
        if (!HtmlEngine.instance) {
            HtmlEngine.instance = new HtmlEngine();
        }
        return HtmlEngine.instance;
    }

    public init(templatePath: string): Promise<void> {
        const partials = [
            'overview', 'markdown', 'modules', 'module', 'component', 'entity',
            'component-detail', 'directive', 'injectable', 'interceptor', 'guard',
            'pipe', 'class', 'interface', 'routes', 'index', 'index-misc',
            'search-results', 'search-input', 'link-type',
            'block-method', 'block-host-listener', 'block-enum', 'block-property',
            'block-index', 'block-constructor', 'block-typealias', 'block-accessors',
            'block-input', 'block-output', 'coverage-report', 'unit-test-report',
            'miscellaneous-functions', 'miscellaneous-variables',
            'miscellaneous-typealiases', 'miscellaneous-enumerations',
            'additional-page', 'package-dependencies', 'package-properties',
            'menu'
        ];

        if (templatePath) {
            const resolvedTemplatePath = path.isAbsolute(templatePath)
                ? templatePath
                : path.resolve(process.cwd() + path.sep + templatePath);

            if (FileEngine.existsSync(resolvedTemplatePath) === false) {
                logger.warn(
                    'Template path specificed but does not exist...using default templates'
                );
            }
        }

        return Promise.all(
            partials.map(partial => {
                const partialPath = this.determineTemplatePath(
                    templatePath,
                    'partials/' + partial + '.hbs'
                );
                return FileEngine.get(partialPath).then(data => {
                    Handlebars.registerPartial(partial, data);
                    // Pre-compile content partials for direct invocation
                    this.compiledPartials[partial] = Handlebars.compile(data, {
                        preventIndent: true,
                        strict: true
                    });
                });
            })
        ).then(() => {
            this.compiledMenu = this.compiledPartials['menu'] ?? null;
            this.compiledSearchInput = this.compiledPartials['search-input'] ?? null;
            this.compiledSearchResults = this.compiledPartials['search-results'] ?? null;
        });
    }

    /** TSX-rendered content for specific contexts */
    private renderTsxContent(data: any): string | null {
        switch (data.context) {
            case 'getting-started':
            case 'readme':
            case 'changelog':
            case 'contributing':
            case 'license':
                return Markdown({ markdown: data.markdown });
            case 'additional-page':
                return AdditionalPage({ additionalPage: data.additionalPage });
            case 'package-dependencies':
                return data.disableDependencies ? '' : PackageDependencies(data);
            case 'package-properties':
                return data.disableProperties ? '' : PackageProperties(data);
            case 'overview':
                return Overview(data);
            case 'modules':
                return Modules(data);
            case 'routes':
                return Routes(data);
            case 'coverage':
                return CoverageReport(data);
            case 'unit-test':
                return UnitTestReport(data);
            default:
                return null; // Fall back to Handlebars
        }
    }

    public render(mainData: any, page: any): string {
        const data = { ...mainData, ...page };

        // Try TSX first, fall back to Handlebars
        let content = this.renderTsxContent(data);
        if (content === null) {
            const partialName = CONTEXT_PARTIAL_MAP[data.context];
            if (partialName && this.compiledPartials[partialName]) {
                if (data.context === 'package-properties' && data.disableProperties) {
                    content = '';
                } else {
                    content = this.compiledPartials[partialName](data);
                }
            } else {
                content = '';
            }
        }

        // Render menu for desktop and mobile
        const menuHtml = this.compiledMenu?.({ ...data, menu: 'normal' }) ?? '';
        const menuHtmlMobile = this.compiledMenu?.({ ...data, menu: 'mobile' }) ?? '';

        return Layout({
            data,
            content,
            menuHtml,
            menuHtmlMobile,
            searchInputHtml: SearchInput(),
            searchResultsHtml: SearchResults(),
        });
    }

    private determineTemplatePath(templatePath: string, filePath: string): string {
        let outPath = path.resolve(__dirname + '/../src/templates/' + filePath);
        if (templatePath) {
            const baseTemplatePath = path.isAbsolute(templatePath)
                ? templatePath
                : path.resolve(process.cwd() + path.sep + templatePath);

            const testPath = path.resolve(baseTemplatePath + path.sep + filePath);
            outPath = FileEngine.existsSync(testPath) ? testPath : outPath;
        }
        return outPath;
    }

    public generateCoverageBadge(outputFolder, label, coverageData) {
        return FileEngine.get(
            path.resolve(__dirname + '/../src/templates/partials/coverage-badge.hbs')
        ).then(
            data => {
                const template: any = Handlebars.compile(data);
                coverageData.label = label;
                const result = template({
                    data: coverageData
                });
                const testOutputDir = outputFolder.match(process.cwd());
                if (testOutputDir && testOutputDir.length > 0) {
                    outputFolder = outputFolder.replace(process.cwd() + path.sep, '');
                }

                return FileEngine.write(
                    outputFolder + path.sep + '/images/coverage-badge-' + label + '.svg',
                    result
                ).catch(err => {
                    logger.error('Error during coverage badge ' + label + ' file generation ', err);
                    return Promise.reject(err);
                });
            },
            err => Promise.reject('Error during coverage badge generation')
        );
    }
}

export default HtmlEngine.getInstance();
