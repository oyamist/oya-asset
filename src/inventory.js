(function(exports) {
    const Asset = require('./asset');
    const Plant = require('./plant');
    const Filter = require('./filter');
    const TValue = require('./tvalue');
    const fs = require('fs');
    const path = require('path');
    const winston = require('winston');

    class Inventory {
        constructor(opts={}) {
            Object.defineProperty(this, 'path', {
                writable: true,
                value: path.join(__dirname,'..', 'inventory.json'),
            });
            this.type = 'Inventory';

            this.update(opts);
        }

        update(opts={}) {
            this.assetMap = opts.assetMap || this.assetMap || {};
            this.path = opts.path || this.path;
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

        open(path=this.path) {
            return new Promise((resolve, reject) => {
                try {
                    this.path = path;
                    if (fs.existsSync(path)) {
                        var json = JSON.parse(fs.readFileSync(path));
                        this.update(json);
                    } else {
                        var indent = path.match(/test-/) ? 2 : 0;
                        fs.writeFileSync(path, JSON.stringify(this,undefined,indent));
                    }
                    resolve(this);
                } catch (e) {
                    winston.error(e.stack);
                    reject(e);
                }
            });
        }

        commit() {
            return new Promise((resolve, reject) => {
                try {
                    var path = this.path;
                    var indent = path.match(/test-/) ? 2 : 0;
                    fs.writeFileSync(path, JSON.stringify(this,undefined,indent));
                    resolve(this);
                } catch (e) {
                    winston.error(e.stack);
                    reject(e);
                }
            });
        }

        close() {
            return this.commit();
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

        guidify(snapshot) {
            var idGuidMap = {};
            this.assets().forEach(asset => idGuidMap[asset.id.toUpperCase()] = asset.guid);
            return Object.keys(snapshot).reduce((acc,key) => {
                var value = snapshot[key];
                var v = (typeof value === 'string') && value.toUpperCase() || value;
                var guid = idGuidMap[v];
                acc[key] = key !== 'id' && guid ? guid : value;
                return acc;
            }, {});
        }

        addAsset(asset) {
            if (asset == null) {
                throw new Error(`Inventory.addAsset() asset is required`);
            }
            if (Asset.assetTypes().indexOf(asset.type) < 0) {
                throw new Error(`Inventory.addAsset() invalid asset type:${asset.type}`);
            }
            var a = this.assetOf(asset);
            return (this.assetMap[a.guid] = a);
        }
    }

    module.exports = exports.Inventory = Inventory;
})(typeof exports === "object" ? exports : (exports = {}));

