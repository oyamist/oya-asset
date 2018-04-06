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
                    this.resourceMethod("get", "inventory/guids", this.getGuids),
                    this.resourceMethod("get", "asset/snapshot/:id", this.getAsset),
                    this.resourceMethod("get", "inventory/snapshots/:date", this.getSnapshots),
                    this.resourceMethod("get", "inventory/snapshots", this.getSnapshots),
                    this.resourceMethod("post", "asset/snapshot", this.postAsset),
                ]),
            });
        }

        update(opts={}) {
            this.inventoryPath = opts.inventoryPath ||
                path.join(global.__appdir, 'local', 'assets');
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
                            inventoryPath: that.inventoryPath,
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
            var self = this;
            return new Promise((resolve, reject) => {
                var async = function*() {
                    try {
                        var asset = yield self.inventory.assetOfId(req.params.id)
                            .then(r=>async.next(r))
                            .catch(e=>{
                                reject(e);
                                async.throw(e);
                            });
                        resolve(asset ? asset.snapshot() : {});
                    } catch (e) {
                        winston.warn(e.stack);
                        reject(e);
                    }
                }();
                async.next();
            });
        }
        
        postAsset(req, res, next) {
            return new Promise((resolve, reject) => {
                var self = this;
                var async = function*() {
                    try {
                        var command = req.body;
                        var t = command.t ? new Date(command.t) : new Date();
                        if (!command.upsert) {
                            var e = new Error(`RbAsset.postAsset() no asset to upsert`);
                            winston.error(e.stack);
                            return reject(e);
                        }
                        var upsert = self.inventory.guidify(command.upsert);
                        var guid = upsert.guid;
                        var asset = null;
                        if (guid) {
                            asset = yield self.inventory.loadAsset(guid).then(r=>async.next(r))
                                .catch(e=>{
                                    winston.error(e.stack);
                                    reject(e);
                                    async.throw(e);
                                });
                        }
                        if (!asset) {
                            asset = self.inventory.assetOf(upsert);
                            yield self.inventory.saveAsset(asset).then(r=>async.next(r))
                                .catch(e => {
                                    winston.error(e.stack);
                                    reject(e);
                                    async.throw(e);
                                });
                            winston.info(`RbAsset.postAsset() created asset ${asset.name}`);
                        }
                        asset.updateSnapshot(upsert,t);
                        yield self.inventory.saveAsset(asset).then(r=>async.next(r))
                            .catch(e => {
                                winston.error(e.stack);
                                reject(e);
                                async.throw(e);
                            });
                        resolve( asset.snapshot() );
                    } catch (e) {
                        winston.warn(e.stack);
                        return reject(e);
                    }
                }();
                async.next();
            });
        }

        getGuids(req, res, next) {
            return [...this.inventory.guids()];
        }

        getSnapshots(req, res, next) {
            var date = req.params.date ? new Date(req.params.date) : new Date();
            var snapshots = [];
            for (var asset of this.inventory.assets()) {
                snapshots.push(asset.snapshot(date));
            }
            return {
                date,
                assets: snapshots,
            };
        }


    } //// class RbAsset

    module.exports = exports.RbAsset = RbAsset;
})(typeof exports === "object" ? exports : (exports = {}));
