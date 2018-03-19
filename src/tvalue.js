(function(exports) {
    const uuidv4 = require("uuid/v4");

    class TValue {
        constructor(opts={}) {
            this.update(opts);
        }

        static get T_NONE() { return "(none)"; } // singular
        static get T_BEGIN() { return "begin"; } // singular
        static get T_END() { return "end"; } // singular
        static get T_ID() { return "id"; } // singular
        static get T_SIZE() { return "size"; } // singular
        static get T_DIMENSIONS() { return "dimensions"; } // singular
        static get T_LOCATION() { return "location"; } // multiple

        static get TIME_RESOLUTION_MS() { return 1; }

        static valueTypes() {
            return [
                TValue.T_NONE,

                TValue.T_BEGIN,
                TValue.T_DIMENSIONS,
                TValue.T_END,
                TValue.T_ID,
                TValue.T_LOCATION,
                TValue.T_SIZE,

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
                this.type = this.type || TValue.T_NONE;
            }
            this.value = opts.value || this.value;
            if (opts.text != null) {
                this.text = opts.text;
            }
        }
    }

    module.exports = exports.TValue = TValue;
})(typeof exports === "object" ? exports : (exports = {}));

