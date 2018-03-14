(function(exports) {
    const Asset = require('./asset');
    const Inventory = require('./inventory');
    const Plant = require('./plant');
    const TValue = require('./tvalue');

    class Query {
        constructor(opts={}) {
            this.update(opts);
        }

        update(opts={}) {
            this.inventory = opts.inventory || this.inventory;
        }
    }

    module.exports = exports.Query = Query;
})(typeof exports === "object" ? exports : (exports = {}));

