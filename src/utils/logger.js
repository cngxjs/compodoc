"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = void 0;
let log = require('fancy-log');
let c = require('picocolors');
var LEVEL;
(function (LEVEL) {
    LEVEL[LEVEL["INFO"] = 0] = "INFO";
    LEVEL[LEVEL["DEBUG"] = 1] = "DEBUG";
    LEVEL[LEVEL["ERROR"] = 2] = "ERROR";
    LEVEL[LEVEL["WARN"] = 3] = "WARN";
})(LEVEL || (LEVEL = {}));
class Logger {
    constructor() {
        this.logger = log;
        this.silent = true;
    }
    info(...args) {
        if (!this.silent) {
            return;
        }
        this.logger(this.format(LEVEL.INFO, ...args));
    }
    error(...args) {
        this.logger(this.format(LEVEL.ERROR, ...args));
    }
    warn(...args) {
        if (!this.silent) {
            return;
        }
        this.logger(this.format(LEVEL.WARN, ...args));
    }
    debug(...args) {
        if (!this.silent) {
            return;
        }
        this.logger(this.format(LEVEL.DEBUG, ...args));
    }
    format(level, ...args) {
        let pad = (s, l, z = '') => {
            var _a;
            return s + Array(Math.max(0, l - ((_a = s.length) !== null && _a !== void 0 ? _a : 0) + 1)).join(z);
        };
        let msg = args.join(' ');
        if (args.length > 1) {
            msg = `${pad(args.shift(), 15, ' ')}: ${args.join(' ')}`;
        }
        switch (level) {
            case LEVEL.INFO:
                msg = c.green(msg);
                break;
            case LEVEL.DEBUG:
                msg = c.cyan(msg);
                break;
            case LEVEL.WARN:
                msg = c.yellow(msg);
                break;
            case LEVEL.ERROR:
                msg = c.red(msg);
                break;
        }
        return [msg].join('');
    }
}
exports.logger = new Logger();
