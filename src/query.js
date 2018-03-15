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
            if (set instanceof Array) {
                var startGuids = set.map(elt=>(typeof elt === 'string' ? elt : elt.guid));
            } else {
                var startGuids = Object.keys(set,t);
            }
            var guidMap = {};
            startGuids.forEach(guid=>{
                var asset = this.inventory.assetOfGuid(guid);
                if (asset) {
                    var value = asset.get(valueType,t);
                    value != null && (guidMap[value] = true);
                }
            });
            var targetGuids = Object.keys(guidMap).sort();
            return targetGuids.map(guid=>this.inventory.assetOfGuid(guid));
        }
    }

    module.exports = exports.Query = Query;
})(typeof exports === "object" ? exports : (exports = {}));

