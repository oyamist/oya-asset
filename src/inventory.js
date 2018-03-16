(function(exports) {
    const Asset = require('./asset');
    const Plant = require('./plant');

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
        }

        assetOfGuid(guid) {
            return this.assetMap[guid];
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
            this.assetMap[asset.guid] = this.assetOf(asset);
        }
    }

    module.exports = exports.Inventory = Inventory;
})(typeof exports === "object" ? exports : (exports = {}));

