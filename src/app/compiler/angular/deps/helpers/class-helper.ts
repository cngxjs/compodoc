import * as crypto from 'node:crypto';
import { SyntaxKind, ts } from 'ts-morph';
import { isIgnore } from '../../../../../utils';
import AngularVersionUtil from '../../../../..//utils/angular-version.util';
import { StringifyArrowFunction } from '../../../../../utils/arrow-function.util';
import BasicTypeUtil from '../../../../../utils/basic-type.util';
import { JsdocParserUtil } from '../../../../../utils/jsdoc-parser.util';
import { kindToType } from '../../../../../utils/kind-to-type';
import { markedAcl } from '../../../../../utils/marked.acl';
import { getNodeDecorators, nodeHasDecorator } from '../../../../../utils/node.util';
import { StringifyObjectLiteralExpression } from '../../../../../utils/object-literal-expression.util';
import { getNamesCompareFn, markedtags, mergeTagsAndArgs } from '../../../../../utils/utils';
import Configuration from '../../../../configuration';
import DependenciesEngine from '../../../../engines/dependencies.engine';
import { DecoratorInspector } from './class-helper/decorator-inspector';
import { JsdocExtractor } from './class-helper/jsdoc-extractor';
import { TypeRenderer } from './class-helper/type-renderer';

export class ClassHelper {
    private jsdocParserUtil = new JsdocParserUtil();
    private typeRenderer = new TypeRenderer();
    private jsdocExtractor = new JsdocExtractor();
    private decoratorInspector = new DecoratorInspector();

    constructor(private typeChecker: ts.TypeChecker) {}

    /**
     * HELPERS
     */

    public stringifyDefaultValue(node: ts.Node): string {
        /**
         * Copyright https://github.com/ng-bootstrap/ng-bootstrap
         */
        if (node && (node as any).getText && node.getText()) {
            return node.getText();
        } else if (node && node.kind === SyntaxKind.FalseKeyword) {
            return 'false';
        } else if (node && node.kind === SyntaxKind.TrueKeyword) {
            return 'true';
        }
        return '';
    }

    /**
     * Initialize common fields for documented items
     */
    /**
     * Detect Angular signal primitives from a property's stringified default value.
     * Returns the signal kind and optional extracted type.
     */
    private detectSignalKind(
        defaultValue: string
    ): { kind: string; signalType?: string; required?: boolean } | undefined {
        if (!defaultValue) {
            return undefined;
        }
        const cleaned = defaultValue.replaceAll('\n', '');

        // Order matters: check specific patterns before generic ones
        const patterns: Array<{ pattern: RegExp; kind: string }> = [
            {
                pattern: /^input\.required\s*<([^>]+)>\s*\(/,
                kind: 'input-signal'
            },
            { pattern: /^input\s*(?:<([^>]+)>)?\s*\(/, kind: 'input-signal' },
            { pattern: /^output\s*(?:<([^>]+)>)?\s*\(/, kind: 'output-signal' },
            { pattern: /^model\s*(?:<([^>]+)>)?\s*\(/, kind: 'model' },
            { pattern: /^model\.required\s*<([^>]+)>\s*\(/, kind: 'model' },
            {
                pattern: /^linkedSignal\s*(?:<([^>]+)>)?\s*\(/,
                kind: 'linked-signal'
            },
            { pattern: /^computed\s*(?:<([^>]+)>)?\s*\(/, kind: 'computed' },
            { pattern: /^signal\s*(?:<([^>]+)>)?\s*\(/, kind: 'signal' },
            { pattern: /^effect\s*\(/, kind: 'effect' },
            { pattern: /^resource\s*(?:<([^>]+)>)?\s*\(/, kind: 'resource' },
            {
                pattern: /^rxResource\s*(?:<([^>]+)>)?\s*\(/,
                kind: 'rx-resource'
            },
            { pattern: /^viewChild\s*(?:<([^>]+)>)?\s*\(/, kind: 'view-child' },
            {
                pattern: /^viewChildren\s*(?:<([^>]+)>)?\s*\(/,
                kind: 'view-children'
            },
            {
                pattern: /^contentChild\s*(?:<([^>]+)>)?\s*\(/,
                kind: 'content-child'
            },
            {
                pattern: /^contentChildren\s*(?:<([^>]+)>)?\s*\(/,
                kind: 'content-children'
            },
            { pattern: /^afterRenderEffect\s*\(/, kind: 'after-render-effect' },
            { pattern: /^afterEveryRender\s*\(/, kind: 'after-every-render' },
            { pattern: /^afterNextRender\s*\(/, kind: 'after-next-render' },
            { pattern: /^afterRender\s*\(/, kind: 'after-render' },
            { pattern: /^inject\s*\(\s*([A-Z_]\w*)/, kind: 'inject' }
        ];

        for (const { pattern, kind } of patterns) {
            const match = pattern.exec(cleaned);
            if (match) {
                const result: {
                    kind: string;
                    signalType?: string;
                    required?: boolean;
                } = { kind };
                if (match[1]) {
                    result.signalType = match[1].trim();
                }
                if (cleaned.includes('.required')) {
                    result.required = true;
                }
                return result;
            }
        }
        return undefined;
    }

    private initializeDocumentationFields(): {
        deprecated: boolean;
        deprecationMessage: string;
        category: string;
    } {
        return {
            deprecated: false,
            deprecationMessage: '',
            category: ''
        };
    }

    /**
     * Extract and filter modifier kinds from a node
     */
    private extractModifierKinds(node: any): number[] | undefined {
        if (!node.modifiers || node.modifiers.length === 0) {
            return undefined;
        }
        let kinds = node.modifiers.map(modifier => modifier.kind);
        if (
            kinds.indexOf(SyntaxKind.PublicKeyword) !== -1 &&
            kinds.indexOf(SyntaxKind.StaticKeyword) !== -1
        ) {
            kinds = kinds.filter(kind => kind !== SyntaxKind.PublicKeyword);
        }
        return kinds;
    }

    /**
     * Ensure private keyword is added for ECMAScript private fields
     */
    private ensurePrivateKeyword(result: any, node: any): void {
        if (this.decoratorInspector.isPrivate(node)) {
            if (!result.modifierKind) {
                result.modifierKind = [];
            }
            const hasAlreadyPrivateKeyword = result.modifierKind.includes(
                SyntaxKind.PrivateKeyword
            );
            if (!hasAlreadyPrivateKeyword) {
                result.modifierKind.push(SyntaxKind.PrivateKeyword);
            }
        }
    }

    /**
     * Set fallback description from jsDoc[0].comment if no description exists
     */
    private setFallbackDescription(result: any, node: any): void {
        if (!result.description && node.jsDoc && node.jsDoc.length > 0) {
            if (typeof node.jsDoc[0].comment !== 'undefined') {
                const rawDescription = node.jsDoc[0].comment;
                result.rawdescription = rawDescription;
                result.description = markedAcl(rawDescription);
            }
        }
    }

    private formatDecorators(decorators) {
        const _decorators = [];

        decorators.forEach((decorator: any) => {
            if (decorator.expression) {
                if (decorator.expression.text) {
                    _decorators.push({ name: decorator.expression.text });
                }
                if (decorator.expression.expression) {
                    const info: any = {
                        name: decorator.expression.expression.text
                    };
                    if (decorator.expression.arguments) {
                        info.stringifiedArguments = this.stringifyArguments(
                            decorator.expression.arguments
                        );
                    }
                    _decorators.push(info);
                }
            }
        });

        return _decorators;
    }

    private handleFunction(arg): string {
        if (arg.function.length === 0) {
            return `${arg.name}${this.getOptionalString(arg)}: () => void`;
        }

        const argums = arg.function.map(argu => {
            const _result = DependenciesEngine.find(argu.type);
            if (_result) {
                if (_result.source === 'internal') {
                    let path = _result.data.type;
                    if (_result.data.type === 'class') {
                        path = 'classe';
                    }
                    return `${argu.name}${this.getOptionalString(arg)}: <a href="../${path}s/${
                        _result.data.name
                    }.html">${argu.type}</a>`;
                } else {
                    const path = AngularVersionUtil.getApiLink(
                        _result.data,
                        Configuration.mainData.angularVersion
                    );
                    return `${argu.name}${this.getOptionalString(
                        arg
                    )}: <a href="${path}" target="_blank">${argu.type}</a>`;
                }
            } else if (BasicTypeUtil.isKnownType(argu.type)) {
                const path = BasicTypeUtil.getTypeUrl(argu.type);
                return `${argu.name}${this.getOptionalString(
                    arg
                )}: <a href="${path}" target="_blank">${argu.type}</a>`;
            } else {
                if (argu.name && argu.type) {
                    return `${argu.name}${this.getOptionalString(arg)}: ${argu.type}`;
                } else {
                    if (argu.name) {
                        return `${argu.name.text}`;
                    } else {
                        return '';
                    }
                }
            }
        });
        return `${arg.name}${this.getOptionalString(arg)}: (${argums}) => void`;
    }

    private getOptionalString(arg): string {
        return arg.optional ? '?' : '';
    }

    private stringifyArguments(args) {
        let stringifyArgs = [];

        stringifyArgs = args
            .map(arg => {
                const _result = DependenciesEngine.find(arg.type);
                if (_result) {
                    if (_result.source === 'internal') {
                        let path = _result.data.type;
                        if (_result.data.type === 'class') {
                            path = 'classe';
                        }
                        return `${arg.name}${this.getOptionalString(arg)}: <a href="../${path}s/${
                            _result.data.name
                        }.html">${arg.type}</a>`;
                    } else {
                        const path = AngularVersionUtil.getApiLink(
                            _result.data,
                            Configuration.mainData.angularVersion
                        );
                        return `${arg.name}${this.getOptionalString(
                            arg
                        )}: <a href="${path}" target="_blank">${arg.type}</a>`;
                    }
                } else if (arg.dotDotDotToken) {
                    return `...${arg.name}: ${arg.type}`;
                } else if (arg.function) {
                    return this.handleFunction(arg);
                } else if (arg.expression && arg.name) {
                    return `${arg.expression.text}.${arg.name.text}`;
                } else if (arg.expression && arg.kind === SyntaxKind.NewExpression) {
                    return `new ${arg.expression.text}()`;
                } else if (arg.kind && arg.kind === SyntaxKind.StringLiteral) {
                    return `'${arg.text}'`;
                } else if (
                    arg.kind &&
                    arg.kind === SyntaxKind.ArrayLiteralExpression &&
                    arg.elements &&
                    arg.elements.length > 0
                ) {
                    let i = 0,
                        len = arg.elements.length,
                        result = '[';
                    for (i; i < len; i++) {
                        result += `'${arg.elements[i].text}'`;
                        if (i < len - 1) {
                            result += ', ';
                        }
                    }
                    result += ']';
                    return result;
                } else if (
                    arg.kind &&
                    arg.kind === SyntaxKind.ArrowFunction &&
                    arg.parameters &&
                    arg.parameters.length > 0
                ) {
                    return StringifyArrowFunction(arg);
                } else if (arg.kind && arg.kind === SyntaxKind.ObjectLiteralExpression) {
                    return StringifyObjectLiteralExpression(arg);
                } else if (BasicTypeUtil.isKnownType(arg.type)) {
                    const path = BasicTypeUtil.getTypeUrl(arg.type);
                    return `${arg.name}${this.getOptionalString(
                        arg
                    )}: <a href="${path}" target="_blank">${arg.type}</a>`;
                } else {
                    if (arg.type) {
                        let finalStringifiedArgument = '';
                        let separator = ':';
                        if (arg.name) {
                            finalStringifiedArgument += arg.name;
                        }
                        if (
                            arg.kind === SyntaxKind.AsExpression &&
                            arg.expression &&
                            arg.expression.text
                        ) {
                            finalStringifiedArgument += arg.expression.text;
                            separator = ' as';
                        }
                        if (arg.optional) {
                            finalStringifiedArgument += this.getOptionalString(arg);
                        }
                        if (arg.type) {
                            finalStringifiedArgument += `${separator} ${this.visitType(arg.type)}`;
                        }
                        return finalStringifiedArgument;
                    } else if (arg.text) {
                        return `${arg.text}`;
                    } else {
                        return `${arg.name}${this.getOptionalString(arg)}`;
                    }
                }
            })
            .join(', ');

        return stringifyArgs;
    }

    private getPosition(node: ts.Node, sourceFile: ts.SourceFile): ts.LineAndCharacter {
        let position: ts.LineAndCharacter;
        if ((node as any).name?.end) {
            position = ts.getLineAndCharacterOfPosition(sourceFile, (node as any).name.end);
        } else {
            position = ts.getLineAndCharacterOfPosition(sourceFile, node.pos);
        }
        return position;
    }

    private addAccessor(accessors, nodeAccessor, sourceFile) {
        let nodeName = '';
        if (nodeAccessor.name) {
            nodeName = nodeAccessor.name.text;
            const jsdoctags = this.jsdocParserUtil.getJSDocs(nodeAccessor);

            if (!accessors[nodeName]) {
                accessors[nodeName] = {
                    name: nodeName,
                    setSignature: undefined,
                    getSignature: undefined
                };
            }

            if (nodeAccessor.kind === SyntaxKind.SetAccessor) {
                const setSignature: any = {
                    name: nodeName,
                    type: 'void',
                    ...this.initializeDocumentationFields(),
                    args: nodeAccessor.parameters.map(param => this.visitArgument(param)),
                    returnType: nodeAccessor.type ? this.visitType(nodeAccessor.type) : 'void',
                    line: this.getPosition(nodeAccessor, sourceFile).line + 1
                };

                this.jsdocExtractor.extractAndProcessJSDocComment(
                    nodeAccessor,
                    sourceFile,
                    setSignature
                );
                this.jsdocExtractor.processJSDocTags(jsdoctags, setSignature);

                if (setSignature.jsdoctags && setSignature.jsdoctags.length > 0) {
                    setSignature.jsdoctags = mergeTagsAndArgs(
                        setSignature.args,
                        setSignature.jsdoctags
                    );
                } else if (setSignature.args && setSignature.args.length > 0) {
                    setSignature.jsdoctags = mergeTagsAndArgs(setSignature.args);
                }

                accessors[nodeName].setSignature = setSignature;
            }
            if (nodeAccessor.kind === SyntaxKind.GetAccessor) {
                const getSignature: any = {
                    name: nodeName,
                    type: nodeAccessor.type ? kindToType(nodeAccessor.type.kind) : '',
                    returnType: nodeAccessor.type ? this.visitType(nodeAccessor.type) : '',
                    line: this.getPosition(nodeAccessor, sourceFile).line + 1
                };

                this.jsdocExtractor.extractAndProcessJSDocComment(
                    nodeAccessor,
                    sourceFile,
                    getSignature
                );
                this.jsdocExtractor.processJSDocTags(jsdoctags, getSignature);

                accessors[nodeName].getSignature = getSignature;
            }
        }
    }

    /**
     * VISITERS
     */

    public visitClassDeclaration(
        fileName: string,
        classDeclaration: ts.ClassDeclaration | ts.InterfaceDeclaration,
        sourceFile?: ts.SourceFile,
        astFile?: ts.SourceFile
    ): any {
        const symbol = this.typeChecker.getSymbolAtLocation(classDeclaration.name);
        let rawdescription = '';
        const deprecation = this.initializeDocumentationFields();
        let description = '';
        let jsdoctags: any[] = [];

        if (symbol) {
            const comment = this.jsdocParserUtil.getMainCommentOfNode(classDeclaration, sourceFile);
            rawdescription = this.jsdocParserUtil.parseComment(comment);
            description = markedAcl(rawdescription);
            if (symbol.valueDeclaration && isIgnore(symbol.valueDeclaration)) {
                return [{ ignore: true }];
            }
            if (symbol.declarations && symbol.declarations.length > 0) {
                const declarationsjsdoctags = this.jsdocParserUtil.getJSDocs(
                    symbol.declarations[0]
                );
                this.jsdocExtractor.processJSDocTags(declarationsjsdoctags, deprecation, false);
                if (isIgnore(symbol.declarations[0])) {
                    return [{ ignore: true }];
                }
            }
            if (symbol.valueDeclaration) {
                jsdoctags = this.jsdocParserUtil.getJSDocs(
                    symbol.valueDeclaration
                ) as unknown as any[];
                if (jsdoctags && jsdoctags.length >= 1) {
                    const jsdoc = jsdoctags[0] as any;
                    if (jsdoc?.tags) {
                        this.jsdocExtractor.checkForDeprecation(jsdoc.tags, deprecation);
                        jsdoctags = markedtags(jsdoc.tags);
                    }
                }
            }
        }

        const className = classDeclaration.name.text;
        let members;
        const implementsElements = [];
        let extendsElements = [];

        if (typeof (ts as any).getEffectiveImplementsTypeNodes !== 'undefined') {
            const implementedTypes = (ts as any).getEffectiveImplementsTypeNodes(classDeclaration);
            if (implementedTypes) {
                let i = 0;
                const len = implementedTypes.length;
                for (i; i < len; i++) {
                    if (implementedTypes[i].expression) {
                        implementsElements.push(implementedTypes[i].expression.text);
                    }
                }
            }
        }

        if (typeof (ts as any).getClassExtendsHeritageElement !== 'undefined') {
            if (astFile) {
                let interfaceOrClassNode = (astFile as any).getInterface(className);
                if (!interfaceOrClassNode) {
                    interfaceOrClassNode = (astFile as any).getClass(className);
                }
                if (interfaceOrClassNode) {
                    const extendsListRaw = interfaceOrClassNode.getExtends();
                    const extendsList = [];
                    if (extendsListRaw) {
                        if (Array.isArray(extendsListRaw)) {
                            if (extendsListRaw.length > 0) {
                                extendsListRaw.forEach(extendElement => {
                                    const extendElementExpression = extendElement.getExpression();
                                    if (extendElementExpression) {
                                        const text = extendElementExpression.getText();
                                        if (text) {
                                            extendsList.push(text);
                                        }
                                    }
                                });
                            }
                        } else {
                            const extendElementExpression = extendsListRaw.getExpression();
                            if (extendElementExpression) {
                                const text = extendElementExpression.getText();
                                if (text) {
                                    extendsList.push(text);
                                }
                            }
                        }
                    }
                    extendsElements = extendsList;
                }
            }
        }
        members = this.visitMembers(classDeclaration.members, sourceFile);

        if (nodeHasDecorator(classDeclaration)) {
            const classDecorators = getNodeDecorators(classDeclaration);
            // Loop and search for Angular decorators:
            // @NgModule, @Component, @Directive, @Injectable, @Pipe
            let isDirective = false;
            let isService = false;
            let isPipe = false;
            let isModule = false;
            for (let a = 0; a < classDecorators.length; a++) {
                //console.log(classDeclaration.decorators[i].expression);

                // RETURN TOO EARLY FOR MANY DECORATORS !!!!
                // iterating through the decorators array we have to keep the flags `true` values from the previous loop iteration
                isDirective =
                    isDirective || this.decoratorInspector.isDirectiveDecorator(classDecorators[a]);
                isService =
                    isService || this.decoratorInspector.isServiceDecorator(classDecorators[a]);
                isPipe = isPipe || this.decoratorInspector.isPipeDecorator(classDecorators[a]);
                isModule =
                    isModule || this.decoratorInspector.isModuleDecorator(classDecorators[a]);
            }
            if (isDirective) {
                return {
                    ...deprecation,
                    description,
                    rawdescription: rawdescription,
                    inputs: members.inputs,
                    outputs: members.outputs,
                    hostBindings: members.hostBindings,
                    hostListeners: members.hostListeners,
                    properties: members.properties,
                    methods: members.methods,
                    indexSignatures: members.indexSignatures,
                    kind: members.kind,
                    constructor: members.constructor,
                    jsdoctags: jsdoctags,
                    extends: extendsElements,
                    implements: implementsElements,
                    accessors: members.accessors
                };
            } else if (isService) {
                return [
                    {
                        fileName,
                        className,
                        ...deprecation,
                        description,
                        rawdescription: rawdescription,
                        methods: members.methods,
                        indexSignatures: members.indexSignatures,
                        properties: members.properties,
                        kind: members.kind,
                        constructor: members.constructor,
                        jsdoctags: jsdoctags,
                        extends: extendsElements,
                        implements: implementsElements,
                        accessors: members.accessors
                    }
                ];
            } else if (isPipe) {
                return [
                    {
                        fileName,
                        className,
                        ...deprecation,
                        description,
                        rawdescription: rawdescription,
                        jsdoctags: jsdoctags,
                        properties: members.properties,
                        methods: members.methods
                    }
                ];
            } else if (isModule) {
                return [
                    {
                        fileName,
                        className,
                        ...deprecation,
                        description,
                        rawdescription: rawdescription,
                        jsdoctags: jsdoctags,
                        methods: members.methods
                    }
                ];
            } else {
                return [
                    {
                        ...deprecation,
                        description,
                        rawdescription: rawdescription,
                        methods: members.methods,
                        indexSignatures: members.indexSignatures,
                        properties: members.properties,
                        kind: members.kind,
                        constructor: members.constructor,
                        jsdoctags: jsdoctags,
                        extends: extendsElements,
                        implements: implementsElements,
                        accessors: members.accessors
                    }
                ];
            }
        }
        if (description) {
            return [
                {
                    ...deprecation,
                    description,
                    rawdescription: rawdescription,
                    inputs: members.inputs,
                    outputs: members.outputs,
                    hostBindings: members.hostBindings,
                    hostListeners: members.hostListeners,
                    methods: members.methods,
                    indexSignatures: members.indexSignatures,
                    properties: members.properties,
                    kind: members.kind,
                    constructor: members.constructor,
                    jsdoctags: jsdoctags,
                    extends: extendsElements,
                    implements: implementsElements,
                    accessors: members.accessors
                }
            ];
        } else {
            return [
                {
                    ...deprecation,
                    methods: members.methods,
                    inputs: members.inputs,
                    outputs: members.outputs,
                    hostBindings: members.hostBindings,
                    hostListeners: members.hostListeners,
                    indexSignatures: members.indexSignatures,
                    properties: members.properties,
                    kind: members.kind,
                    constructor: members.constructor,
                    jsdoctags: jsdoctags,
                    extends: extendsElements,
                    implements: implementsElements,
                    accessors: members.accessors
                }
            ];
        }
    }

    private visitMembers(members: any, sourceFile: any) {
        /**
         * Copyright https://github.com/ng-bootstrap/ng-bootstrap
         */
        const inputs = [];
        const outputs = [];
        const methods = [];
        const properties = [];
        const indexSignatures = [];
        let kind;
        let inputDecorator;
        const hostBindings = [];
        const hostListeners = [];
        let constructor;
        let outputDecorator;
        const accessors = {};
        let result = {};

        for (let i = 0; i < members.length; i++) {
            // Allows typescript guess type when using ts.is*
            const member = members[i];

            inputDecorator = this.decoratorInspector.getDecoratorOfType(member, 'Input');
            outputDecorator = this.decoratorInspector.getDecoratorOfType(member, 'Output');
            const parsedHostBindings = this.decoratorInspector.getDecoratorOfType(
                member,
                'HostBinding'
            );
            const parsedHostListeners = this.decoratorInspector.getDecoratorOfType(
                member,
                'HostListener'
            );

            kind = member.kind;

            if (isIgnore(member)) {
                continue;
            }

            if (
                this.decoratorInspector.isInternal(member) &&
                Configuration.mainData.disableInternal
            ) {
                continue;
            }

            if (inputDecorator && inputDecorator.length > 0) {
                inputs.push(this.visitInputAndHostBinding(member, inputDecorator[0], sourceFile));
                if (ts.isSetAccessorDeclaration(member)) {
                    this.addAccessor(accessors, members[i], sourceFile);
                }
            } else if (outputDecorator && outputDecorator.length > 0) {
                outputs.push(this.visitOutput(member, outputDecorator[0], sourceFile));
            } else if (parsedHostBindings && parsedHostBindings.length > 0) {
                let k = 0;
                const lenHB = parsedHostBindings.length;
                for (k; k < lenHB; k++) {
                    hostBindings.push(
                        this.visitInputAndHostBinding(member, parsedHostBindings[k], sourceFile)
                    );
                }
            } else if (parsedHostListeners && parsedHostListeners.length > 0) {
                let l = 0;
                const lenHL = parsedHostListeners.length;
                for (l; l < lenHL; l++) {
                    hostListeners.push(
                        this.visitHostListener(member, parsedHostListeners[l], sourceFile)
                    );
                }
            }

            if (!this.decoratorInspector.isHiddenMember(member)) {
                if (
                    !(
                        this.decoratorInspector.isPrivate(member) &&
                        Configuration.mainData.disablePrivate
                    )
                ) {
                    if (
                        !(
                            this.decoratorInspector.isInternal(member) &&
                            Configuration.mainData.disableInternal
                        )
                    ) {
                        if (
                            !(
                                this.decoratorInspector.isProtected(member) &&
                                Configuration.mainData.disableProtected
                            )
                        ) {
                            if (ts.isMethodDeclaration(member) || ts.isMethodSignature(member)) {
                                methods.push(this.visitMethodDeclaration(member, sourceFile));
                            } else if (
                                ts.isPropertyDeclaration(member) ||
                                ts.isPropertySignature(member)
                            ) {
                                if (!inputDecorator && !outputDecorator) {
                                    properties.push(this.visitProperty(member, sourceFile));
                                }
                            } else if (ts.isCallSignatureDeclaration(member)) {
                                properties.push(this.visitCallDeclaration(member, sourceFile));
                            } else if (
                                ts.isGetAccessorDeclaration(member) ||
                                ts.isSetAccessorDeclaration(member)
                            ) {
                                this.addAccessor(accessors, members[i], sourceFile);
                            } else if (ts.isIndexSignatureDeclaration(member)) {
                                indexSignatures.push(
                                    this.visitIndexDeclaration(member, sourceFile)
                                );
                            } else if (ts.isConstructorDeclaration(member)) {
                                const _constructorProperties = this.visitConstructorProperties(
                                    member,
                                    sourceFile
                                );
                                let j = 0;
                                const len = _constructorProperties.length;
                                for (j; j < len; j++) {
                                    properties.push(_constructorProperties[j]);
                                }
                                constructor = this.visitConstructorDeclaration(member, sourceFile);
                            }
                        }
                    }
                }
            }
        }

        inputs.sort(getNamesCompareFn());
        outputs.sort(getNamesCompareFn());
        hostBindings.sort(getNamesCompareFn());
        hostListeners.sort(getNamesCompareFn());
        properties.sort(getNamesCompareFn());
        methods.sort(getNamesCompareFn());
        indexSignatures.sort(getNamesCompareFn());

        result = {
            inputs,
            outputs,
            hostBindings,
            hostListeners,
            methods,
            properties,
            indexSignatures,
            kind,
            constructor
        };

        if (Object.keys(accessors).length) {
            result['accessors'] = accessors;
        }

        return result;
    }

    public visitTypeIndex(node): string {
        return this.typeRenderer.visitTypeIndex(node);
    }

    public visitType(node): string {
        return this.typeRenderer.visitType(node);
    }

    private visitCallDeclaration(method: ts.CallSignatureDeclaration, sourceFile: ts.SourceFile) {
        const sourceCode = sourceFile.getText();
        const hash = crypto.createHash('sha512').update(sourceCode).digest('hex');
        const result: any = {
            id: `call-declaration-${hash}`,
            args: method.parameters ? method.parameters.map(prop => this.visitArgument(prop)) : [],
            returnType: this.visitType(method.type),
            line: this.getPosition(method, sourceFile).line + 1,
            ...this.initializeDocumentationFields()
        };
        this.jsdocExtractor.extractAndProcessJSDocComment(method, sourceFile, result);
        const jsdoctags = this.jsdocParserUtil.getJSDocs(method);
        this.jsdocExtractor.processJSDocTags(jsdoctags, result);
        return result;
    }

    private visitIndexDeclaration(
        method: ts.IndexSignatureDeclaration,
        sourceFile?: ts.SourceFile
    ) {
        const sourceCode = sourceFile.getText();
        const hash = crypto.createHash('sha512').update(sourceCode).digest('hex');
        const result = {
            id: `index-declaration-${hash}`,
            args: method.parameters ? method.parameters.map(prop => this.visitArgument(prop)) : [],
            returnType: this.visitType(method.type),
            line: this.getPosition(method, sourceFile).line + 1,
            ...this.initializeDocumentationFields()
        };
        this.jsdocExtractor.extractAndProcessJSDocComment(method, sourceFile, result);
        const jsdoctags = this.jsdocParserUtil.getJSDocs(method);
        this.jsdocExtractor.processJSDocTags(jsdoctags, result);
        return result;
    }

    private visitConstructorDeclaration(
        method: ts.ConstructorDeclaration,
        sourceFile?: ts.SourceFile
    ) {
        /**
         * Copyright https://github.com/ng-bootstrap/ng-bootstrap
         */
        const result: any = {
            name: 'constructor',
            description: '',
            ...this.initializeDocumentationFields(),
            args: method.parameters ? method.parameters.map(prop => this.visitArgument(prop)) : [],
            line: this.getPosition(method, sourceFile).line + 1
        };
        this.jsdocExtractor.extractAndProcessJSDocComment(method, sourceFile, result);

        const kinds = this.extractModifierKinds(method);
        if (kinds) {
            result.modifierKind = kinds;
        }

        const jsdoctags = this.jsdocParserUtil.getJSDocs(method);
        this.jsdocExtractor.processJSDocTags(jsdoctags, result);

        if (result.jsdoctags && result.jsdoctags.length > 0) {
            result.jsdoctags = mergeTagsAndArgs(result.args, result.jsdoctags);
        } else if (result.args.length > 0) {
            result.jsdoctags = mergeTagsAndArgs(result.args);
        }

        // Thread @param descriptions back into `result.args` so downstream
        // consumers (e.g. `DependenciesSection`) that don't walk
        // `jsdoctags` still see the per-parameter description text.
        if (result.args.length > 0 && result.jsdoctags?.length > 0) {
            const commentByName = new Map<string, any>();
            for (const tag of result.jsdoctags) {
                const tagName = tag.name?.text ?? tag.name;
                if (tagName && tag.comment) {
                    commentByName.set(String(tagName), tag.comment);
                }
            }
            for (const arg of result.args) {
                const comment = commentByName.get(arg.name);
                if (comment != null) {
                    arg.description = comment;
                }
            }
        }
        return result;
    }

    private visitProperty(property: ts.PropertyDeclaration | ts.PropertySignature, sourceFile) {
        // PropertySignature (interfaces) don't have initializer, PropertyDeclaration (classes) do
        const initializer = ts.isPropertyDeclaration(property) ? property.initializer : undefined;

        // Extract property name, handling different node types:
        // - Identifier: regular property names
        // - PrivateIdentifier: ECMAScript private fields like #privateField
        // - ComputedPropertyName: computed names like ['__allAnd']
        let propertyName = '';
        // Check for mock objects first (for testing)
        if ((property.name as any).text) {
            propertyName = (property.name as any).text;
        } else if (ts.isIdentifier(property.name)) {
            propertyName = property.name.text;
        } else if (ts.isPrivateIdentifier(property.name)) {
            propertyName = property.name.text; // includes the # prefix
        } else if (ts.isComputedPropertyName(property.name)) {
            // Handle computed property names like ['__allAnd']
            if (ts.isStringLiteral(property.name.expression)) {
                propertyName = property.name.expression.text;
            } else if (ts.isIdentifier(property.name.expression)) {
                propertyName = property.name.expression.text;
            }
        }

        const result: any = {
            name: propertyName,
            defaultValue: initializer ? this.stringifyDefaultValue(initializer) : undefined,
            ...this.initializeDocumentationFields(),
            type: this.visitType(property),
            indexKey: this.visitTypeIndex(property),
            optional: typeof property.questionToken !== 'undefined',
            description: '',
            line: this.getPosition(property, sourceFile).line + 1
        };

        if (initializer && initializer.kind === SyntaxKind.ArrowFunction) {
            result.defaultValue = '() => {...}';
        }

        // Detect signal primitives from initializer
        if (result.defaultValue) {
            const signalKind = this.detectSignalKind(result.defaultValue);
            if (signalKind) {
                result.signalKind = signalKind.kind;
                if (signalKind.signalType) {
                    result.type = signalKind.signalType;
                }
                if (signalKind.required) {
                    result.required = true;
                }
            }
        }

        // Extract signal dependency names for computed/linkedSignal.
        // `this.xxx()` → recorded as 'xxx()'; `this.xxx` (plain access) → recorded as 'xxx'.
        if (
            initializer &&
            (result.signalKind === 'computed' || result.signalKind === 'linked-signal')
        ) {
            const deps: string[] = [];
            const walk = (node: any, parent: any): void => {
                if (
                    node.kind === SyntaxKind.PropertyAccessExpression &&
                    node.expression?.kind === SyntaxKind.ThisKeyword
                ) {
                    const isCalled =
                        parent &&
                        parent.kind === SyntaxKind.CallExpression &&
                        parent.expression === node;
                    deps.push(isCalled ? `${node.name.text}()` : node.name.text);
                }
                ts.forEachChild(node, child => walk(child, node));
            };
            ts.forEachChild(initializer, child => walk(child, initializer));
            if (deps.length > 0) {
                result.signalDeps = [...new Set(deps)];
            }
        }

        if (typeof result.name === 'undefined' && (property.name as any).expression) {
            result.name = (property.name as any).expression.text;
        }

        this.jsdocExtractor.extractAndProcessJSDocComment(property, sourceFile, result);

        if (nodeHasDecorator(property)) {
            const propertyDecorators = getNodeDecorators(property);
            result.decorators = this.formatDecorators(propertyDecorators);
        }

        const kinds = this.extractModifierKinds(property);
        if (kinds) {
            result.modifierKind = kinds;
        }
        // Check for ECMAScript Private Fields
        this.ensurePrivateKeyword(result, property);

        const jsdoctags = this.jsdocParserUtil.getJSDocs(property);
        if (jsdoctags && jsdoctags.length >= 1) {
            const jsdoc = jsdoctags[0] as any;
            if (jsdoc?.tags) {
                this.jsdocExtractor.checkForDeprecation(jsdoc.tags, result);
                if ((property as any).jsDoc) {
                    result.jsdoctags = markedtags(jsdoc.tags);
                }
            }
        }

        return result;
    }

    private visitConstructorProperties(constr, sourceFile) {
        if (constr.parameters) {
            const _parameters = [];
            let i = 0;
            const len = constr.parameters.length;
            for (i; i < len; i++) {
                const parameterOfConstructor = constr.parameters[i];
                if (isIgnore(parameterOfConstructor)) {
                    continue;
                }
                if (
                    this.decoratorInspector.isInternal(parameterOfConstructor) &&
                    Configuration.mainData.disableInternal
                ) {
                    continue;
                }
                if (this.decoratorInspector.isPublic(parameterOfConstructor)) {
                    _parameters.push(this.visitProperty(constr.parameters[i], sourceFile));
                }
            }
            /**
             * Merge JSDoc tags description from constructor with parameters
             */
            if (constr.jsDoc) {
                if (constr.jsDoc.length > 0) {
                    const constrTags = constr.jsDoc[0].tags;
                    if (constrTags && constrTags.length > 0) {
                        constrTags.forEach(tag => {
                            _parameters.forEach(param => {
                                if (
                                    tag.tagName?.escapedText &&
                                    tag.tagName.escapedText === 'param'
                                ) {
                                    if (
                                        tag.name?.escapedText &&
                                        tag.name.escapedText === param.name
                                    ) {
                                        param.description = tag.comment;
                                    }
                                }
                            });
                        });
                    }
                }
            }
            return _parameters;
        } else {
            return [];
        }
    }

    private visitMethodDeclaration(
        method: ts.MethodDeclaration | ts.MethodSignature,
        sourceFile: ts.SourceFile
    ) {
        const result: any = {
            name:
                (method.name as any).text || (ts.isIdentifier(method.name) ? method.name.text : ''),
            args: method.parameters ? method.parameters.map(prop => this.visitArgument(prop)) : [],
            optional: typeof method.questionToken !== 'undefined',
            returnType: this.visitType(method.type),
            typeParameters: [],
            line: this.getPosition(method, sourceFile).line + 1,
            ...this.initializeDocumentationFields()
        };

        if (typeof method.type === 'undefined') {
            // Try to get inferred type
            if ((method as any).symbol) {
                const symbol: ts.Symbol = (method as any).symbol;
                if (symbol.valueDeclaration) {
                    const symbolType = this.typeChecker.getTypeOfSymbolAtLocation(
                        symbol,
                        symbol.valueDeclaration
                    );
                    if (symbolType) {
                        try {
                            const signature = this.typeChecker.getSignatureFromDeclaration(method);
                            const returnType = signature.getReturnType();
                            result.returnType = this.typeChecker.typeToString(returnType);
                            // tslint:disable-next-line:no-empty
                        } catch (_error) {}
                    }
                }
            }
        }

        if (method.typeParameters && method.typeParameters.length > 0) {
            result.typeParameters = method.typeParameters.map(typeParameter =>
                this.visitType(typeParameter)
            );
        }

        this.jsdocExtractor.extractAndProcessJSDocComment(method, sourceFile, result);

        if (nodeHasDecorator(method)) {
            const methodDecorators = getNodeDecorators(method);
            result.decorators = this.formatDecorators(methodDecorators);
        }

        const kinds = this.extractModifierKinds(method);
        if (kinds) {
            result.modifierKind = kinds;
        }
        // Check for ECMAScript Private Fields
        this.ensurePrivateKeyword(result, method);

        const jsdoctags = this.jsdocParserUtil.getJSDocs(method);
        this.jsdocExtractor.processJSDocTags(jsdoctags, result);

        if (result.jsdoctags && result.jsdoctags.length > 0) {
            result.jsdoctags = mergeTagsAndArgs(result.args, result.jsdoctags);
        } else if (result.args.length > 0) {
            result.jsdoctags = mergeTagsAndArgs(result.args);
        }
        return result;
    }

    private visitOutput(
        property: ts.PropertyDeclaration,
        outDecorator: ts.Decorator,
        sourceFile?: ts.SourceFile
    ) {
        const inArgs = (outDecorator.expression as any).arguments;
        const _return: any = {
            name:
                inArgs.length > 0
                    ? (inArgs[0] as any).text
                    : (property.name as any).text ||
                      (ts.isIdentifier(property.name) ? property.name.text : ''),
            defaultValue: property.initializer
                ? this.stringifyDefaultValue(property.initializer)
                : undefined,
            ...this.initializeDocumentationFields()
        };

        if ((property as any).jsDoc) {
            this.jsdocExtractor.extractAndProcessJSDocComment(property, sourceFile, _return);
            const jsdoctags = this.jsdocParserUtil.getJSDocs(property);
            this.jsdocExtractor.processJSDocTags(jsdoctags, _return);
        }

        this.setFallbackDescription(_return, property);
        _return.line = this.getPosition(property, sourceFile).line + 1;

        if (property.type) {
            _return.type = this.visitType(property);
        } else {
            // handle NewExpression
            if (property.initializer) {
                if (ts.isNewExpression(property.initializer)) {
                    if (property.initializer.expression) {
                        _return.type = (property.initializer.expression as any).text;
                    }
                }
            }
        }
        return _return;
    }

    private visitArgument(arg: ts.ParameterDeclaration) {
        const _result: any = {
            name: (arg.name as any).text || (ts.isIdentifier(arg.name) ? arg.name.text : ''),
            type: this.visitType(arg),
            optional: !!arg.questionToken,
            dotDotDotToken: !!arg.dotDotDotToken,
            ...this.initializeDocumentationFields()
        };
        if (arg.type?.kind && ts.isFunctionTypeNode(arg.type)) {
            _result.function = arg.type.parameters
                ? arg.type.parameters.map(prop => this.visitArgument(prop))
                : [];
        }
        if (arg.initializer) {
            _result.defaultValue = this.stringifyDefaultValue(arg.initializer);
        }
        const jsdoctags = this.jsdocParserUtil.getJSDocs(arg);
        this.jsdocExtractor.processJSDocTags(jsdoctags, _result, false);
        return _result;
    }

    private visitInputAndHostBinding(property, inDecorator, sourceFile?) {
        const inArgs = inDecorator.expression.arguments;

        const _return: any = {};

        let isInputConfigStringLiteral = false;
        let isInputConfigObjectLiteralExpression = false;
        let hasRequiredField = false;
        let hasAlias = false;

        const getRequiredField = () =>
            inArgs[0].properties.find(property => property.name.escapedText === 'required');
        const getAliasProperty = () =>
            inArgs[0].properties.find(property => property.name.escapedText === 'alias');

        if (inArgs.length > 0) {
            isInputConfigStringLiteral = inArgs[0] && ts.isStringLiteral(inArgs[0]);

            isInputConfigObjectLiteralExpression =
                inArgs[0] && ts.isObjectLiteralExpression(inArgs[0]);

            if (isInputConfigObjectLiteralExpression && inArgs[0].properties) {
                hasRequiredField = isInputConfigObjectLiteralExpression && !!getRequiredField();
                hasAlias = isInputConfigObjectLiteralExpression ? !!getAliasProperty() : false;

                _return.required = !!getRequiredField();
            }

            _return.name = isInputConfigStringLiteral
                ? inArgs[0].text
                : hasAlias
                  ? getAliasProperty().initializer.text
                  : property.name.text;
        } else {
            _return.name = property.name.text;
        }

        _return.defaultValue = property.initializer
            ? this.stringifyDefaultValue(property.initializer)
            : undefined;
        Object.assign(_return, this.initializeDocumentationFields());

        if (inArgs.length > 0 && inArgs[0].properties && hasRequiredField) {
            _return.optional = getRequiredField().initializer.kind !== SyntaxKind.TrueKeyword;
        }

        if (!_return.description && property.jsDoc && property.jsDoc.length > 0) {
            const jsdoctags = this.jsdocParserUtil.getJSDocs(property);
            this.jsdocExtractor.processJSDocTags(jsdoctags, _return);
            this.jsdocExtractor.extractAndProcessJSDocComment(property, sourceFile, _return);
        }
        _return.line = this.getPosition(property, sourceFile).line + 1;
        if (property.type) {
            _return.type = this.visitType(property);
        } else {
            // handle NewExpression
            if (property.initializer) {
                if (ts.isNewExpression(property.initializer)) {
                    if (property.initializer.expression) {
                        _return.type = property.initializer.expression.text;
                    }
                }
            }
            // Try to get inferred type
            if (property.symbol) {
                const symbol: ts.Symbol = property.symbol;
                if (symbol.valueDeclaration) {
                    const symbolType = this.typeChecker.getTypeOfSymbolAtLocation(
                        symbol,
                        symbol.valueDeclaration
                    );
                    if (symbolType) {
                        _return.type = this.typeChecker.typeToString(symbolType);
                    }
                }
            }
        }
        if (property.kind === SyntaxKind.SetAccessor) {
            // For setter accessor, find type in first parameter
            if (property.parameters && property.parameters.length === 1) {
                if (property.parameters[0].type) {
                    _return.type = this.visitType(property.parameters[0].type);
                }
            }
        }

        if (nodeHasDecorator(property)) {
            const propertyDecorators = getNodeDecorators(property);
            _return.decorators = this.formatDecorators(propertyDecorators).filter(
                item => item.name !== 'Input' && item.name !== 'HostBinding'
            );
        }
        return _return;
    }

    private visitHostListener(property, hostListenerDecorator, sourceFile?) {
        const inArgs = hostListenerDecorator.expression.arguments;
        const _return: any = {};
        _return.name = inArgs.length > 0 ? inArgs[0].text : property.name.text;
        _return.args = property.parameters
            ? property.parameters.map(prop => this.visitArgument(prop))
            : [];
        _return.argsDecorator =
            inArgs.length > 1
                ? inArgs[1].elements.map(prop => {
                      return prop.text;
                  })
                : [];
        Object.assign(_return, this.initializeDocumentationFields());

        if (property.jsDoc) {
            this.jsdocExtractor.extractAndProcessJSDocComment(property, sourceFile, _return);
            const jsdoctags = this.jsdocParserUtil.getJSDocs(property);
            this.jsdocExtractor.processJSDocTags(jsdoctags, _return);
        }

        this.setFallbackDescription(_return, property);
        _return.line = this.getPosition(property, sourceFile).line + 1;
        return _return;
    }
}
