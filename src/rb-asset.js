(function(exports) {
    const winston = require('winston');
    const Inventory = require('./inventory');
    const EventEmitter = require("events");
    const srcPkg = require("../package.json");
    const fs = require('fs');
    const path = require("path");
    const {
        RestBundle,
        RbHash,
        RbSingleton,
    } = require("rest-bundle");
    const exec = require('child_process').exec;

    class RbAsset extends RestBundle {
        constructor(name = "test", opts = {}) {
            super(name, Object.assign({
                srcPkg,
            }, opts));

            this.update(opts);

            winston.info(`RbAsset.ctor(${name})`);
            Object.defineProperty(this, "handlers", {
                value: super.handlers.concat([
                    this.resourceMethod("get", "assets/:date", this.getAssets),
                ]),
            });
        }

        update(opts={}) {
            this.inventoryPath = opts.inventoryPath || path.join(global.__appdir, 'inventory.json');
        }

        initialize() {
            var promise = super.initialize();
            var that = this;
            return new Promise((resolve,reject) => {
                var async = function*() {
                    try {
                        yield promise.then(r=>async.next(r)).catch(e=>{
                            winston.error(e.stack);
                            reject(e);
                        });
                        if (fs.existsSync(that.inventoryPath)) {
                            winston.info(`RbAsset.initialize() loading: ${that.inventoryPath}`);
                            var json = JSON.parse(fs.readFileSync(that.inventoryPath));
                            that.inventory = new Inventory(json);
                        } else {
                            winston.info(`RbAsset.initialize() using default inventory`);
                            that.inventory = new Inventory();
                        }
                        resolve();
                    } catch (e) {
                        winston.error(e.stack);
                        reject(e);
                    }
                }();
                async.next();
            });
        }

        getAssets(req, res, next) {
            var date = new Date(req.params.date);
            var assets = this.inventory.assets().map(asset=>asset.snapshot(date));
            return {
                date,
                assets: this.inventory.assets().map(asset=>asset.snapshot(date)),
            };
        }


    } //// class RbAsset

    module.exports = exports.RbAsset = RbAsset;
})(typeof exports === "object" ? exports : (exports = {}));
