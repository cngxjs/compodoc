import * as crypto from 'crypto';
import { IDep } from '../dependencies.interfaces';
import { ComponentHelper } from './helpers/component-helper';
import Configuration from '../../../configuration';
import { cleanLifecycleHooksFromMethods } from '../../../../utils';

export class DirectiveDepFactory {
    constructor(private helper: ComponentHelper) {}

    public create(file: any, srcFile: any, name: any, props: any, IO: any): IDirectiveDep {
        const sourceCode = srcFile.getText();
        const hash = crypto.createHash('sha512').update(sourceCode).digest('hex');
        const directiveDeps: IDirectiveDep = {
            name,
            id: 'directive-' + name + '-' + hash,
            file: file,
            type: 'directive',
            description: IO.description,
            rawdescription: IO.rawdescription,
            sourceCode: srcFile.getText(),
            selector: this.helper.getComponentSelector(props, srcFile),
            providers: this.helper.getComponentProviders(props, srcFile),
            exportAs: this.helper.getComponentExportAs(props, srcFile),
            hostDirectives: [...this.helper.getComponentHostDirectives(props)],

            standalone: this.helper.getComponentStandalone(props, srcFile) ? true : false,

            inputsClass: IO.inputs,
            outputsClass: IO.outputs,

            deprecated: IO.deprecated,
            deprecationMessage: IO.deprecationMessage,
            category: IO.category || '',

            // Custom JSDoc tags (Phase 4.6)
            signal: IO.signal || false,
            zoneless: IO.zoneless || false,
            beta: IO.beta || false,
            since: IO.since || '',
            breaking: IO.breaking || '',
            group: IO.group || '',

            hostBindings: IO.hostBindings,
            hostListeners: IO.hostListeners,

            propertiesClass: IO.properties,
            methodsClass: IO.methods,
            exampleUrls: this.helper.getComponentExampleUrls(srcFile.getText())
        };

        if (Configuration.mainData.disableLifeCycleHooks) {
            directiveDeps.methodsClass = cleanLifecycleHooksFromMethods(directiveDeps.methodsClass);
        }
        if (IO.jsdoctags && IO.jsdoctags.length > 0) {
            directiveDeps.jsdoctags = IO.jsdoctags[0].tags;
        }
        if (IO.extends) {
            directiveDeps.extends = IO.extends;
        }
        if (IO.implements && IO.implements.length > 0) {
            directiveDeps.implements = IO.implements;
        }
        if (IO.constructor && !Configuration.mainData.disableConstructors) {
            directiveDeps.constructorObj = IO.constructor;
        }
        if (IO.accessors) {
            directiveDeps.accessors = IO.accessors;
        }
        if (IO.properties) {
            const {inputSignals, outputSignals, properties} = this.helper.getInputOutputSignals(IO.properties);

            directiveDeps.inputsClass = directiveDeps.inputsClass.concat(inputSignals)
            directiveDeps.outputsClass = directiveDeps.outputsClass.concat(outputSignals)
            directiveDeps.propertiesClass = properties;
        }
        return directiveDeps;
    }
}

export interface IDirectiveDep extends IDep {
    file: any;
    description: string;
    rawdescription: string;
    sourceCode: string;

    selector: string;
    providers: Array<any>;
    exportAs: string;

    inputsClass: any;
    outputsClass: any;

    standalone: boolean;

    deprecated: boolean;
    deprecationMessage: string;
    category?: string;

    // Custom JSDoc tags
    signal?: boolean;
    zoneless?: boolean;
    beta?: boolean;
    since?: string;
    breaking?: string;
    group?: string;

    hostBindings: any;
    hostDirectives: any;
    hostListeners: any;

    propertiesClass: any;
    methodsClass: any;
    exampleUrls: Array<string>;

    constructorObj?: Object;
    jsdoctags?: Array<string>;
    implements?: any;
    accessors?: Object;
    extends?: any;
}
