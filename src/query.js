(function(exports) {
    const Asset = require('./asset');
    const Inventory = require('./inventory');
    const Plant = require('./plant');
    const TValue = require('./tvalue');

    class Query {
        constructor(opts={}) {
            this.update(opts);
        }

        static guidAscending(a,b) {
            return a.guid < b.guid ? -1 : (a.guid === b.guid ? 0 : 1);
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
                return assets.map(elt=>(typeof elt === 'string' ? elt : (elt && elt.guid || null)));
            } else if (typeof assets === 'string') {
                var asset = this.inventory.assetOfGuid(assets);
                return asset ? [asset.guid] : [];
            }
            throw new Error(`Query.assetGuids() expected asset or collection of assets`);
        }

        parents(set,valueTag,t=new Date()) {
            return this.ancestors(set, valueTag, t, 1);
        }

        ancestors(set,valueTag,t=new Date(),n=0) {
            t = t || new Date(); // null
            var guidMap = {};
            var srcGuids = this.assetGuids(set);
            var result = [];
            srcGuids.forEach(guid=>{
                var srcAsset = this.inventory.assetOfGuid(guid);
                var value = srcAsset && srcAsset.get(valueTag,t);
                var steps = 0;
                while (value && !guidMap[value] && (n===0 || steps++<n)) {
                    var dstAsset = this.inventory.assetOfGuid(value);
                    if (dstAsset) { // value is an asset guid
                        guidMap[value] = true;
                        result.push(dstAsset);
                        value = dstAsset.get(valueTag,t);
                    }
                }
            });
            return result.sort(Query.guidAscending);
        }

        descendants(set,valueTag,t=new Date(),n=0) {
            t = t || new Date(); // null

            var isAncestor = {};
            var srcGuids = this.assetGuids(set);
            srcGuids.length || (srcGuids = [null,undefined]); // orphans
            srcGuids.forEach(guid => (isAncestor[guid] = true));

            var candidates = this.inventory.assets();
            var result = [];
            var step = 0;

            do {
                var children = [];
                var newCandidates = [];
                candidates.forEach(asset => {
                    var parent = asset.get(valueTag,t);
                    if (isAncestor[parent]) {
                        children.push(asset);
                    } else {
                        newCandidates.push(asset);
                    }
                });
                children.forEach(asset=>isAncestor[asset.guid] = true);
                result = result.concat(children);
                candidates = newCandidates;
            } while (children.length && (n === 0 || ++step < n));

            return result.sort(Query.guidAscending);
        }
    }

    module.exports = exports.Query = Query;
})(typeof exports === "object" ? exports : (exports = {}));

