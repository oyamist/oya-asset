(function(exports) {
    const Asset = require('./asset');
    const Inventory = require('./inventory');
    const Plant = require('./plant');
    const TValue = require('./tvalue');

    function guidAscending(a,b) {
        return a.guid < b.guid ? -1 : (a.guid === b.guid ? 0 : 1);
    }

    class Query {
        constructor(opts={}) {
            this.update(opts);
        }

        update(opts={}) {
            this.inventory = opts.inventory || this.inventory;
        }

        assetGuids(assets) {
            if (assets == null) {
                return [];
            } else if (assets instanceof Asset) {
                return [assets.guid];
            } else if (assets instanceof Array) {
                return assets.map(elt=>(typeof elt === 'string' ? elt : elt.guid));
            } else if (typeof assets === 'string') {
                var asset = this.inventory.assetOfGuid(assets);
                return asset ? [asset.guid] : [];
            }
            throw new Error(`Query.assetGuids() expected asset or collection of assets`);
        }

        neighbors(set,valueType,t=new Date()) {
            var guidMap = {};
            var result = [];
            this.assetGuids(set).forEach(guid=>{
                var srcAsset = this.inventory.assetOfGuid(guid);
                var value = srcAsset && srcAsset.get(valueType,t);
                if (value && !guidMap[value]) {
                    var dstAsset = this.inventory.assetOfGuid(value);
                    if (dstAsset) { // value is an asset guid
                        guidMap[value] = true;
                        result.push(dstAsset);
                    }
                }
            });
            return result.sort(guidAscending);
        }

        parents(set,valueType,t=new Date()) {
            var guidMap = {};
            var srcGuids = this.assetGuids(set);
            var result = [];
            srcGuids.forEach(guid=>{
                var srcAsset = this.inventory.assetOfGuid(guid);
                var value = srcAsset && srcAsset.get(valueType,t);
                if (value && !guidMap[value]) {
                    var dstAsset = this.inventory.assetOfGuid(value);
                    if (dstAsset) { // value is an asset guid
                        guidMap[value] = true;
                        result.push(dstAsset);
                        value = dstAsset.get(valueType,t);
                    }
                }
            });
            return result.sort(guidAscending);
        }
    }

    module.exports = exports.Query = Query;
})(typeof exports === "object" ? exports : (exports = {}));

