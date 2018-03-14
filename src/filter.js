(function(exports) {
    const Asset = require('./asset');
    const TValue = require('./tvalue');

    class Filter {
        constructor(opts={}) {
            this.update(opts);
        }

        static get TValueFilter() { return TValueFilter; }

        static get OP_EQ() { return "="; }
        static get OP_NE() { return "!="; }
        static get OP_LT() { return "<"; }
        static get OP_LE() { return "<="; }
        static get OP_GT() { return ">"; }
        static get OP_GE() { return ">="; }

        update(opts={}) {
        }

        matches(asset) {
            return false;
        }

    }

    class TValueFilter extends Filter {
        constructor(op=Filter.OP_EQ, tvalue, opts={}){
            super(opts);
            this.update({
                tvalue,
                op,
            }, opts);
        }

        update(opts={}) {
            super.update();
            this.tvalue = opts.tvalue || this.tvalue || new TValue();
            this.op = opts.op || this.op;
        }

        matchRelational(assetValue, op, tvalue) {
            if (typeof assetValue === 'string' || typeof assetValue === 'number') {
                if (op === Filter.OP_EQ) {
                    if (assetValue === tvalue.value) {
                        return true;
                    }
                } else if (op === Filter.OP_NE) {
                    return !this.matchRelational(assetValue, Filter.OP_EQ, tvalue);
                } else if (op === Filter.OP_LT) {
                    return !this.matchRelational(assetValue, Filter.OP_GE, tvalue);
                } else if (op === Filter.OP_LE) {
                    return !this.matchRelational(assetValue, Filter.OP_GT, tvalue);
                } else if (op === Filter.OP_GT) {
                    if (assetValue > tvalue.value) {
                        return true;
                    }
                } else if (op === Filter.OP_GE) {
                    if (assetValue >= tvalue.value ) {
                        return true;
                    }
                }
            } else {
                throw new Error(`TValueFilter.matchRelational() not implemented for value type:${typeof assetValue}`);
            }
            return false;
        }

        matches(asset) {
            var assetValue = asset.get(this.tvalue.type, this.tvalue.t);
            return this.matchRelational(assetValue, this.op, this.tvalue);
        }
    }


    module.exports = exports.Filter = Filter;
})(typeof exports === "object" ? exports : (exports = {}));

