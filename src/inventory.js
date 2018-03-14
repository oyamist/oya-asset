(function(exports) {
    const Asset = require('./asset');
    const Plant = require('./plant');

    class Inventory {
        constructor(opts={}) {
            this.update(opts);
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
            this.assets = opts.assets || this.assets || {};
            var keys = Object.keys(this.assets);
            for (var i = 0; i < keys.length; i++) {
                var key = keys[i];
                var asset = this.assets[key];
                if (asset == null) {
                    delete this.assets[key];
                } else {
                    this.assets[key] = this.assetOf(asset);
                }
            }
        }

        assetOfGuid(guid) {
            return this.assets[guid];
        }

        addAsset(asset) {
            if (asset == null) {
                throw new Error(`Inventory.addAsset() asset is required`);
            }
            if (Asset.assetTypes().indexOf(asset.type) < 0) {
                throw new Error(`Inventory.addAsset() invalid asset type:${asset.type}`);
            }
            this.assets[asset.guid] = this.assetOf(asset);
        }
    }

    module.exports = exports.Inventory = Inventory;
})(typeof exports === "object" ? exports : (exports = {}));

