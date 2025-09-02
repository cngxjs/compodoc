"use strict";
// @ts-nocheck
Object.defineProperty(exports, "__esModule", { value: true });
exports.SymbolHelper = void 0;
const ts_morph_1 = require("ts-morph");
const ts_printer_util_1 = require("../../../../../utils/ts-printer.util");
const imports_util_1 = require("../../../../../utils/imports.util");
var AngularProviderConfigProperties;
(function (AngularProviderConfigProperties) {
    AngularProviderConfigProperties["Useclass"] = "useClass";
    AngularProviderConfigProperties["UseValue"] = "useValue";
    AngularProviderConfigProperties["UseFactory"] = "useFactory";
    AngularProviderConfigProperties["UseExisting"] = "useExisting";
})(AngularProviderConfigProperties || (AngularProviderConfigProperties = {}));
;
class SymbolHelper {
    constructor() {
        this.unknown = '???';
    }
    parseDeepIndentifier(name, srcFile) {
        let result = {
            name: '',
            type: ''
        };
        if (typeof name === 'undefined') {
            return result;
        }
        let nsModule = name.split('.');
        let type = this.getType(name);
        if (nsModule.length > 1) {
            result.ns = nsModule[0];
            result.name = name;
            result.type = type;
            return result;
        }
        if (typeof srcFile !== 'undefined') {
            result.file = imports_util_1.default.getFileNameOfImport(name, srcFile);
        }
        result.name = name;
        result.type = type;
        return result;
    }
    getType(name) {
        let type;
        if (name.toLowerCase().indexOf('component') !== -1) {
            type = 'component';
        }
        else if (name.toLowerCase().indexOf('pipe') !== -1) {
            type = 'pipe';
        }
        else if (name.toLowerCase().indexOf('controller') !== -1) {
            type = 'controller';
        }
        else if (name.toLowerCase().indexOf('module') !== -1) {
            type = 'module';
        }
        else if (name.toLowerCase().indexOf('directive') !== -1) {
            type = 'directive';
        }
        else if (name.toLowerCase().indexOf('injectable') !== -1 ||
            name.toLowerCase().indexOf('service') !== -1) {
            type = 'injectable';
        }
        return type;
    }
    /**
     * Output
     * RouterModule.forRoot 179
     */
    buildIdentifierName(node, name) {
        if (ts_morph_1.ts.isIdentifier(node) && !ts_morph_1.ts.isPropertyAccessExpression(node)) {
            return `${node.text}.${name}`;
        }
        name = name ? `.${name}` : '';
        let nodeName = this.unknown;
        if (node.name) {
            nodeName = node.name.text;
        }
        else if (node.text) {
            nodeName = node.text;
        }
        else if (node.expression) {
            if (node.expression.text) {
                nodeName = node.expression.text;
            }
            else if (node.expression.elements) {
                if (ts_morph_1.ts.isArrayLiteralExpression(node.expression)) {
                    nodeName = node.expression.elements.map(el => el.text).join(', ');
                    nodeName = `[${nodeName}]`;
                }
            }
        }
        if (ts_morph_1.ts.isSpreadElement(node)) {
            return `...${nodeName}`;
        }
        return `${this.buildIdentifierName(node.expression, nodeName)}${name}`;
    }
    /**
     * parse expressions such as:
     * { provide: APP_BASE_HREF, useValue: '/' }
     * { provide: 'Date', useFactory: (d1, d2) => new Date(), deps: ['d1', 'd2'] }
     */
    parseProviderConfiguration(node) {
        if (node.kind && node.kind === ts_morph_1.SyntaxKind.ObjectLiteralExpression) {
            const provideProperty = node.properties.find((props) => props.name.getText() === 'provide');
            if (!provideProperty) {
                throw new Error("provide property not found in provider object config");
            }
            const providerObjectProps = Object.values(AngularProviderConfigProperties);
            for (let i = 0; i < providerObjectProps.length; i++) {
                const providerProp = providerObjectProps[i];
                const prop = node.properties.find((props) => props.name.getText() === providerProp);
                if (prop) {
                    return prop.getLastToken().getText();
                }
            }
        }
        return new ts_printer_util_1.TsPrinterUtil().print(node);
    }
    /**
     * Kind
     *  181 CallExpression => "RouterModule.forRoot(args)"
     *   71 Identifier     => "RouterModule" "TodoStore"
     *    9 StringLiteral  => "./app.component.css" "./tab.scss"
     */
    parseSymbolElements(node) {
        // parse expressions such as: AngularFireModule.initializeApp(firebaseConfig)
        // if (ts.isCallExpression(node) && ts.isPropertyAccessExpression(node.expression)) {
        if ((ts_morph_1.ts.isCallExpression(node) && ts_morph_1.ts.isPropertyAccessExpression(node.expression)) ||
            (ts_morph_1.ts.isNewExpression(node) && ts_morph_1.ts.isElementAccessExpression(node.expression))) {
            let className = this.buildIdentifierName(node.expression);
            // function arguments could be really complex. There are so
            // many use cases that we can't handle. Just print "args" to indicate
            // that we have arguments.
            let functionArgs = node.arguments.length > 0 ? 'args' : '';
            let text = `${className}(${functionArgs})`;
            return text;
        }
        else if (ts_morph_1.ts.isPropertyAccessExpression(node)) {
            // parse expressions such as: Shared.Module
            return this.buildIdentifierName(node);
        }
        else if (ts_morph_1.ts.isIdentifier(node)) {
            // parse expressions such as: MyComponent
            if (node.text) {
                return node.text;
            }
            if (node.escapedText) {
                return node.escapedText;
            }
        }
        else if (ts_morph_1.ts.isSpreadElement(node)) {
            // parse expressions such as: ...MYARRAY
            // Resolve MYARRAY in imports or local file variables after full scan, just return the name of the variable
            if (node.expression && node.expression.text) {
                return node.expression.text;
            }
        }
        return node.text ? node.text : this.parseProviderConfiguration(node);
    }
    /**
     * Kind
     *  177 ArrayLiteralExpression
     *  122 BooleanKeyword
     *    9 StringLiteral
     */
    parseSymbols(node, srcFile, decoratorType) {
        let localNode = node;
        if (ts_morph_1.ts.isShorthandPropertyAssignment(localNode) && decoratorType !== 'template') {
            localNode = imports_util_1.default.findValueInImportOrLocalVariables(node.name.text, srcFile, decoratorType);
        }
        if (ts_morph_1.ts.isShorthandPropertyAssignment(localNode) && decoratorType === 'template') {
            const data = imports_util_1.default.findValueInImportOrLocalVariables(node.name.text, srcFile, decoratorType);
            return [data];
        }
        if (localNode.initializer && ts_morph_1.ts.isArrayLiteralExpression(localNode.initializer)) {
            return localNode.initializer.elements.map(x => this.parseSymbolElements(x));
        }
        else if ((localNode.initializer && ts_morph_1.ts.isStringLiteral(localNode.initializer)) ||
            (localNode.initializer && ts_morph_1.ts.isTemplateLiteral(localNode.initializer)) ||
            (localNode.initializer &&
                ts_morph_1.ts.isPropertyAssignment(localNode) &&
                localNode.initializer.text)) {
            return [localNode.initializer.text];
        }
        else if (localNode.initializer &&
            localNode.initializer.kind &&
            (localNode.initializer.kind === ts_morph_1.SyntaxKind.TrueKeyword ||
                localNode.initializer.kind === ts_morph_1.SyntaxKind.FalseKeyword)) {
            return [localNode.initializer.kind === ts_morph_1.SyntaxKind.TrueKeyword ? true : false];
        }
        else if (localNode.initializer && ts_morph_1.ts.isPropertyAccessExpression(localNode.initializer)) {
            let identifier = this.parseSymbolElements(localNode.initializer);
            return [identifier];
        }
        else if (localNode.initializer &&
            localNode.initializer.elements &&
            localNode.initializer.elements.length > 0) {
            // Node replaced by ts-simple-ast & kind = 265
            return localNode.initializer.elements.map(x => this.parseSymbolElements(x));
        }
    }
    getSymbolDeps(props, decoratorType, srcFile, multiLine) {
        if (props.length === 0) {
            return [];
        }
        let i = 0, len = props.length, filteredProps = [];
        for (i; i < len; i++) {
            if (props[i].name && props[i].name.text === decoratorType) {
                filteredProps.push(props[i]);
            }
        }
        return filteredProps.map(x => this.parseSymbols(x, srcFile, decoratorType)).pop() || [];
    }
    getSymbolDepsRaw(props, type, multiLine) {
        return props.filter(node => node.name.getText() === type);
    }
}
exports.SymbolHelper = SymbolHelper;
