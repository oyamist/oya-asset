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

        neighbors(set,valueType,t=new Date()) {
            var startGuids = Object.keys(set,t);
            var neighbors = {};
            startGuids.forEach(guid=>{
                var asset = this.inventory.assetOfGuid(guid);
                if (asset) {
                    var value = asset.get(valueType,t);
                    value != null && (neighbors[value] = true);
                }
            });
            return neighbors;
        }
    }

    module.exports = exports.Query = Query;
})(typeof exports === "object" ? exports : (exports = {}));

