(function(exports) {
    const uuidv4 = require("uuid/v4");

    class TValue {
        constructor(opts={}) {
            this.t = opts.t || new Date();
            if (!(this.t instanceof Date)) {
                this.t = new Date(this.t);
            }
            if (opts.hasOwnProperty('tag')) {
                if (typeof opts.tag !== 'string') {
                    throw new Error(`Invalid tag:${opts.tag}`);
                }
                this.tag = opts.tag;
            } else {
                this.tag = TValue.T_NONE;
            }
            this.value = opts.value;
            if (opts.text != null) {
                this.text = opts.text;
            }
        }

        static get T_NONE() { return "(none)"; } // singular
        static get T_ACTIVATED() { return "activated"; } // singular
        static get T_ID() { return "id"; } 
        static get T_NAME() { return "name"; } 
        static get T_SIZE() { return "size"; } 
        static get T_DIMENSIONS() { return "dimensions"; } 
        static get T_LOCATION() { return "location"; } 

        static get TIME_RESOLUTION_MS() { return 2; }
        static get RETROACTIVE() { 
            return new Date(-8640000000000000); // Javascript minimum date
        }

        static valueTags() {
            return [
                TValue.T_NONE,

                TValue.T_DIMENSIONS,
                TValue.T_ID,
                TValue.T_LOCATION,
                TValue.T_NAME,
                TValue.T_SIZE,

            ];
        }

        static compareTime(a,b) {
            if (a.t < b.t) {
                return -1;
            }
            return  (a.t === b.t) ? 0 : 1;
        }

    }

    module.exports = exports.TValue = TValue;
})(typeof exports === "object" ? exports : (exports = {}));

