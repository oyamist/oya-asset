(function(exports) {
    const uuidv4 = require("uuid/v4");

    class TValue {
        constructor(opts={}) {
            this.update(opts);
        }

        static get T_BEGIN() { return "begin"; } // singular
        static get T_END() { return "end"; } // singular
        static get T_LOCATION() { return "location"; } // multiple
        static get T_DIMENSIONS() { return "dimensions"; } // multiple

        static valueTypes() {
            return [
                TValue.T_BEGIN,
                TValue.T_END,
                TValue.T_LOCATION,
                TValue.T_DIMENSIONS,
            ];
        }

        update(opts={}) {
            this.t = opts.t || this.t || new Date();
            if (!(this.t instanceof Date)) {
                this.t = new Date(this.t);
            }
            if (opts.hasOwnProperty('type')) {
                if (typeof opts.type !== 'string') {
                    throw new Error(`Invalid type:${opts.type}`);
                }
                this.type = opts.type;
            } else {
                this.type = this.type || TValue.T_BEGIN;
            }
            this.value = opts.value || this.value;
            this.text = opts.text || this.text;
        }
    }

    module.exports = exports.TValue = TValue;
})(typeof exports === "object" ? exports : (exports = {}));

