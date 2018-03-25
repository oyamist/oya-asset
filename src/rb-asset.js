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
                    this.resourceMethod("get", "asset/snapshot/:id", this.getAsset),
                    this.resourceMethod("get", "inventory/snapshots/:date", this.getAssets),
                    this.resourceMethod("get", "inventory/snapshots", this.getAssets),
                    this.resourceMethod("post", "asset/snapshot", this.postAsset),
                ]),
            });
        }

        update(opts={}) {
            this.inventoryPath = opts.inventoryPath || 
                path.join(global.__appdir, 'local', 'inventory.json');
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
                        that.inventory = new Inventory({
                            path: that.inventoryPath,
                        });
                        that.inventory.open().then(r=>resolve()).catch(e=>reject(e));
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
                var command = req.body;
                var t = command.t ? new Date(command.t) : new Date();
                if (!command.upsert) {
                    throw new Error(`RbAsset.postAsset() no asset to upsert`);
                }
                var upsert = this.inventory.guidify(command.upsert);
                var guid = upsert.guid;
                var asset = guid && this.inventory.assetOfGuid(guid);
                if (!asset) {
                    asset = this.inventory.assetOf(upsert);
                    this.inventory.addAsset(asset);
                    winston.info(`RbAsset.postAsset() created asset ${asset.name}`);
                }
                asset.updateSnapshot(upsert,t);
                return asset.snapshot();
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
