import * as path from 'node:path';
import traverse from 'neotraverse/legacy';

import { logger } from '../../utils/logger';
import Configuration from '../configuration';

import type {
    ExportData,
    ExportModule,
    ExportModuleChildGroup
} from '../interfaces/export-data.interface';
import type { AngularNgModuleNode } from '../nodes/angular-ngmodule-node';
import DependenciesEngine from './dependencies.engine';
import FileEngine from './file.engine';

export class ExportJsonEngine {
    private static instance: ExportJsonEngine;
    private constructor() {}
    public static getInstance() {
        if (!ExportJsonEngine.instance) {
            ExportJsonEngine.instance = new ExportJsonEngine();
        }
        return ExportJsonEngine.instance;
    }

    public export(outputFolder, data) {
        const exportData: ExportData = {};

        traverse(data).forEach(node => {
            if (node) {
                if (node.parent) {
                    delete node.parent;
                }
                if (node.initializer) {
                    delete node.initializer;
                }
                if (Configuration.mainData.disableSourceCode) {
                    delete node.sourceCode;
                    delete node.templateData;
                    delete node.styleUrlsData;
                    delete node.stylesData;
                }
            }
        });

        exportData.pipes = data.pipes;
        exportData.interfaces = data.interfaces;
        exportData.injectables = data.injectables;
        exportData.guards = data.guards;
        exportData.interceptors = data.interceptors;
        exportData.classes = data.classes;
        exportData.directives = data.directives;
        exportData.components = data.components;
        exportData.modules = this.processModules();
        exportData.miscellaneous = data.miscellaneous;
        if (!Configuration.mainData.disableRoutesGraph) {
            exportData.routes = data.routes;
        }
        if (!Configuration.mainData.disableCoverage) {
            exportData.coverage = data.coverageData;
        }

        return FileEngine.write(
            `${outputFolder + path.sep}/documentation.json`,
            JSON.stringify(exportData, undefined, 4)
        ).catch(err => {
            logger.error('Error during export file generation ', err);
            return Promise.reject(err);
        });
    }

    public processModules(): ExportModule[] {
        const modules: AngularNgModuleNode[] = DependenciesEngine.getModules();

        const _resultedModules: ExportModule[] = [];

        for (let moduleNr = 0; moduleNr < modules.length; moduleNr++) {
            const module = modules[moduleNr];
            const children: ExportModuleChildGroup[] = [
                { type: 'providers', elements: [] },
                { type: 'declarations', elements: [] },
                { type: 'imports', elements: [] },
                { type: 'exports', elements: [] },
                { type: 'bootstrap', elements: [] },
                { type: 'classes', elements: [] }
            ];
            const moduleElement: ExportModule = {
                name: module.name,
                id: module.id,
                description: module.description,
                rawDescription: module.rawDescription,
                deprecationMessage: module.deprecationMessage,
                deprecated: module.deprecated,
                file: module.file,
                methods: module.methods,
                sourceCode: module.sourceCode,
                children
            };

            for (let k = 0; k < module.providers.length; k++) {
                children[0].elements.push({ name: module.providers[k].name });
            }
            for (let k = 0; k < module.declarations.length; k++) {
                children[1].elements.push({ name: module.declarations[k].name });
            }
            for (let k = 0; k < module.imports.length; k++) {
                children[2].elements.push({ name: module.imports[k].name });
            }
            for (let k = 0; k < module.exports.length; k++) {
                children[3].elements.push({ name: module.exports[k].name });
            }
            for (let k = 0; k < module.bootstrap.length; k++) {
                children[4].elements.push({ name: module.bootstrap[k].name });
            }

            _resultedModules.push(moduleElement);
        }

        return _resultedModules;
    }
}

export default ExportJsonEngine.getInstance();
