"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TsPrinterUtil = void 0;
const ts_morph_1 = require("ts-morph");
class TsPrinterUtil {
    constructor() {
        this.printer = ts_morph_1.ts.createPrinter({
            newLine: ts_morph_1.ts.NewLineKind.LineFeed
        });
    }
    print(node) {
        return this.printer.printNode(ts_morph_1.ts.EmitHint.Unspecified, node, ts_morph_1.ts.createSourceFile('', '', ts_morph_1.ts.ScriptTarget.Latest));
    }
}
exports.TsPrinterUtil = TsPrinterUtil;
