import * as path from 'path';

import { logger } from '../../utils/logger';
import FileEngine from './file.engine';
import { Layout } from '../../templates/Layout';
import { SearchInput } from '../../templates/components/SearchInput';
import { CoverageBadge } from '../../templates/components/CoverageBadge';
import { Menu } from '../../templates/components/Menu';
import { Markdown } from '../../templates/pages/Markdown';
import { AdditionalPage } from '../../templates/pages/AdditionalPage';
import { PackageDependencies } from '../../templates/pages/PackageDependencies';
import { PackageProperties } from '../../templates/pages/PackageProperties';
import { Overview } from '../../templates/pages/Overview';
import { Modules } from '../../templates/pages/Modules';
import { Routes } from '../../templates/pages/Routes';
import { CoverageReport } from '../../templates/pages/CoverageReport';
import { UnitTestReport } from '../../templates/pages/UnitTestReport';
import { ClassPage } from '../../templates/pages/ClassPage';
import { DirectivePage } from '../../templates/pages/DirectivePage';
import { EntityDetailPage } from '../../templates/pages/EntityDetailPage';
import { GuardPage } from '../../templates/pages/GuardPage';
import { InjectablePage } from '../../templates/pages/InjectablePage';
import { InterceptorPage } from '../../templates/pages/InterceptorPage';
import { InterfacePage } from '../../templates/pages/InterfacePage';
import { MiscellaneousEnumerations } from '../../templates/pages/MiscellaneousEnumerations';
import { MiscellaneousFunctions } from '../../templates/pages/MiscellaneousFunctions';
import { MiscellaneousTypealiases } from '../../templates/pages/MiscellaneousTypealiases';
import { MiscellaneousVariables } from '../../templates/pages/MiscellaneousVariables';
import { ModulePage } from '../../templates/pages/ModulePage';
import { PipePage } from '../../templates/pages/PipePage';
import { ComponentPage } from '../../templates/pages/ComponentPage';
import { loadCustomTemplates, renderCustomTemplate } from './custom-template.engine';

/** Map page context to its custom template file name */
const CONTEXT_TEMPLATE_MAP: Record<string, string> = {
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
    private static instance: HtmlEngine;
    private constructor() {}
    public static getInstance() {
        if (!HtmlEngine.instance) {
            HtmlEngine.instance = new HtmlEngine();
        }
        return HtmlEngine.instance;
    }

    public init(templatePath: string): Promise<void> {
        loadCustomTemplates(templatePath);
        return Promise.resolve();
    }

    /** TSX-rendered content for specific contexts */
    private renderTsxContent(data: any): string {
        // Check for custom JS template override first
        const templateName = CONTEXT_TEMPLATE_MAP[data.context];
        if (templateName) {
            const custom = renderCustomTemplate(templateName, data);
            if (custom !== null) return custom;
        }

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
            case 'class':
                return ClassPage(data);
            case 'directive':
                return DirectivePage(data);
            case 'entity':
                return EntityDetailPage(data);
            case 'guard':
                return GuardPage(data);
            case 'injectable':
                return InjectablePage(data);
            case 'interceptor':
                return InterceptorPage(data);
            case 'interface':
                return InterfacePage(data);
            case 'module':
                return ModulePage(data);
            case 'pipe':
                return PipePage(data);
            case 'miscellaneous-functions':
                return MiscellaneousFunctions(data);
            case 'miscellaneous-variables':
                return MiscellaneousVariables(data);
            case 'miscellaneous-typealiases':
                return MiscellaneousTypealiases(data);
            case 'miscellaneous-enumerations':
                return MiscellaneousEnumerations(data);
            case 'component':
                return ComponentPage(data);
            default:
                return '';
        }
    }

    public render(mainData: any, page: any): string {
        const data = { ...mainData, ...page };
        const content = this.renderTsxContent(data);

        // Check for custom menu override
        const customMenu = renderCustomTemplate('menu', { ...data, menu: 'normal' });
        const menuHtml = customMenu ?? Menu({ data, mode: 'normal' });
        const customMenuMobile = renderCustomTemplate('menu', { ...data, menu: 'mobile' });
        const menuHtmlMobile = customMenuMobile ?? Menu({ data, mode: 'mobile' });

        return Layout({
            data,
            content,
            menuHtml,
            menuHtmlMobile,
            searchInputHtml: SearchInput(),
        });
    }

    public generateCoverageBadge(outputFolder: string, label: string, coverageData: any) {
        coverageData.label = label;
        const result = CoverageBadge(coverageData);

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
    }
}

export default HtmlEngine.getInstance();
