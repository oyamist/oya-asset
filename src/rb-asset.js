(function(exports) {
    const winston = require('winston');
    const Inventory = require('./inventory');
    const Filter = require('./filter');
    const TValue = require('./tvalue');
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
                    this.resourceMethod("get", "asset/:id", this.getAsset),
                    this.resourceMethod("get", "assets/:date", this.getAssets),
                    this.resourceMethod("get", "assets", this.getAssets),
                    this.resourceMethod("post", "asset", this.postAsset),
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

        getAsset(req, res, next) {
            try {
                var asset =  this.inventory.assetOfId(req.params.id);
                return asset ? asset.snapshot() : {};
            } catch (e) {
                winston.warn(e.stack);
                return Promise.reject(e);
            }
        }
        
        postAsset(req, res, next) {
            try {
                var asset = req.body;
                Asset.validate(asset.type);

            } catch (e) {
                winston.warn(e.stack);
                return Promise.reject(e);
            }
        }

        getAssets(req, res, next) {
            var date = req.params.date ? new Date(req.params.date) : new Date();
            var assets = this.inventory.assets().map(asset=>asset.snapshot(date));
            return {
                date,
                assets: this.inventory.assets().map(asset=>asset.snapshot(date)),
            };
        }


    } //// class RbAsset

    module.exports = exports.RbAsset = RbAsset;
})(typeof exports === "object" ? exports : (exports = {}));
