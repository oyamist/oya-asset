(function(exports) {
    const Asset = require('./asset');
    const Plant = require('./plant');
    const Filter = require('./filter');
    const TValue = require('./tvalue');

    class Inventory {
        constructor(opts={}) {
            this.update(opts);
            this.type = 'Inventory';
        }

        assetOf(asset) {
            if (asset instanceof Asset) {
                return asset;
            }
            if (asset.type === Asset.T_PLANT) {
                return new Plant(asset);
            } 

            return new Asset(asset);
        }

        update(opts={}) {
            this.assetMap = opts.assetMap || this.assetMap || {};
            var keys = Object.keys(this.assetMap);
            for (var i = 0; i < keys.length; i++) {
                var key = keys[i];
                var asset = this.assetMap[key];
                if (asset == null) {
                    delete this.assetMap[key];
                } else {
                    this.assetMap[key] = this.assetOf(asset);
                }
            }
            return undefined; // TBD
        }

        assetOfGuid(guid) {
            return this.assetMap[guid];
        }

        assetOfId(id, t=new Date()) {
            if (id == null) {
                throw new Error("id is required");
            }
            var tvf = new Filter.TValueFilter(Filter.OP_EQ, {
                tag: TValue.T_ID,
                value: id,
                t,
            });
            var assets =  this.assets(tvf);
            if (assets.length > 1) {
                throw new Error(`Data integrity error: ${assets.length} assets have same id: ${id}`);
            }
            return assets[0];
        }

        assets(filter) {
            var guids = Object.keys(this.assetMap).sort();
            var assets =  guids.map(guid=>this.assetMap[guid]);
            return filter ? assets.filter(a=>filter.matches(a)) : assets;
        }

        addAsset(asset) {
            if (asset == null) {
                throw new Error(`Inventory.addAsset() asset is required`);
            }
            if (Asset.assetTypes().indexOf(asset.type) < 0) {
                throw new Error(`Inventory.addAsset() invalid asset type:${asset.type}`);
            }
            return (this.assetMap[asset.guid] = this.assetOf(asset));
        }
    }

    module.exports = exports.Inventory = Inventory;
})(typeof exports === "object" ? exports : (exports = {}));

