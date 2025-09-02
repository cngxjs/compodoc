"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FileEngine = void 0;
const fs = require("fs-extra");
const path = require("path");
class FileEngine {
    constructor() { }
    static getInstance() {
        if (!FileEngine.instance) {
            FileEngine.instance = new FileEngine();
        }
        return FileEngine.instance;
    }
    get(filepath) {
        return new Promise((resolve, reject) => {
            fs.readFile(path.resolve(filepath), 'utf8', (err, data) => {
                if (err) {
                    reject('Error during ' + filepath + ' read');
                }
                else {
                    resolve(data);
                }
            });
        });
    }
    write(filepath, contents) {
        return new Promise((resolve, reject) => {
            fs.outputFile(path.resolve(filepath), contents, err => {
                if (err) {
                    reject(err);
                }
                else {
                    resolve();
                }
            });
        });
    }
    writeSync(filepath, contents) {
        fs.outputFileSync(filepath, contents);
    }
    getSync(filepath) {
        return fs.readFileSync(path.resolve(filepath), 'utf8');
    }
    /**
     * @param file The file to check
     */
    existsSync(file) {
        return fs.existsSync(file);
    }
}
exports.FileEngine = FileEngine;
exports.default = FileEngine.getInstance();
