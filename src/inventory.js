(function(exports) {
    const Asset = require('./asset');
    const Plant = require('./plant');
    const Filter = require('./filter');
    const TValue = require('./tvalue');
    const fs = require('fs');
    const path = require('path');
    const winston = require('winston');
    const MerkleJson = require('merkle-json').MerkleJson;
    const FOLDER_PREFIX = 2;
    var mj = new MerkleJson();

    class Inventory {
        constructor(opts={}) {
            var local = path.join(__dirname, '..', 'local');
            if (!fs.existsSync(local)) {
                fs.mkdirSync(local);
            }
            Object.defineProperty(this, 'assetDir', {
                writable: true,
                value: path.join(local, 'assets'),
            });
            Object.defineProperty(this, 'isOpen', {
                writable: true,
                value: false,
            });
            this.type = 'Inventory';

            this.update(opts);
        }

        update(opts={}) {
            this.assetMap = opts.assetMap || this.assetMap || {};
            var local = path.join(__dirname, '..', 'local');
            opts.assetDir && (this.assetDir = opts.assetDir);
            if (!fs.existsSync(this.assetDir)) {
                winston.info(`Inventory.update() creating assets directory: ${this.assetDir}`);
                fs.mkdirSync(this.assetDir);
            }
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

        assetCount() {
            if (!this.isOpen) {
                throw new Error(`Inventory.assetCount() inventory must be open()'d`);
            }
            return Object.keys(this.assetMap).length;
        }

        load(ivpath) {
            if (!this.isOpen) {
                var e = new Error("Inventory.load() inventory must be open()'d");
                winston.warn(e.stack);
                return Promise.reject(e);
            }
            var ereject = new Error(`Inventory.load() no file:${ivpath}`);
            if (!fs.existsSync(ivpath)) {
                return Promise.reject(ereject);
            }
            var self = this;
            return new Promise((resolve, reject) => {
                fs.readFile(ivpath, (e,data) => {
                    if (e) {
                        winston.error(e.message, ereject.stack);
                        return reject(e);
                    } 
                    var async = function*() {
                        try {
                            var json = JSON.parse(data);
                            var keys = Object.keys(json.assetMap);
                            for (var i = 0; i < keys.length; i++) {
                                var key = keys[i];
                                var asset = self.assetOf(json.assetMap[key]);
                                yield self.saveAsset(asset).then(r=>async.next(r))
                                    .catch(e=> {
                                        reject(e); 
                                        async.throw(e);
                                    });
                            };
                            resolve(self);
                        } catch (e) {
                            winston.error(e.message, ereject.stack);
                            reject(e);
                        }
                    }();
                    async.next();
                });
            });
        }

        save(savePath) {
            if (typeof savePath !== string || !savePath.length) {
                var e = new Error(`Inventory.save() file path is required`);
                return Promise.reject(e);
            }
            return new Promise((resolve, reject) => {
                try {
                    var indent = savePath.match(/test-/) ? 4 : 0;
                    var json =JSON.stringify(this,undefined,indent);
                    fs.writeFile(savePath, json, (e) => {
                        if (e) {
                            winston.error(stack); 
                            reject(e); 
                            return;
                        }
                        resolve(this);
                    });
                } catch (e) {
                    winston.error(e.stack);
                    reject(e);
                }
            });
        }

        open() {
            if (this.isOpen) {
                return Promise.resolve(this);
            }
            return new Promise((resolve, reject) => {
                var self = this;
                var async = function*() {
                    try {
                        var objects = path.join(self.assetDir, 'objects');
                        var files = [];
                        if (fs.existsSync(objects)) {
                            var r = yield fs.readdir(objects, (err, folders) => {
                                async.next(err || folders);
                            });
                            if (r instanceof Error) {
                                throw r;
                            }
                            var folders = r || [];
                            for (var i = 0; i < folders.length; i++) {
                                var folder = path.join(objects, folders[i]);
                                var r = yield fs.readdir(folder, (err, folderFiles) => {
                                    async.next(err || folderFiles);
                                });
                                if (r instanceof Error) {
                                    throw r;
                                }
                                files = files.concat(r);
                            }
                        }
                        var r = null;
                        for (var i = 0; i < files.length; i++) {
                            var guid = files[i];
                            r = yield self.loadAsset(guid).then(r=>async.next(r)).catch(e=>async.next(e));
                            if (r instanceof Error) {
                                throw r;
                            }
                            r = null;
                        }

                        if (r instanceof Error) {
                            throw r;
                        }
                        self.isOpen = true;
                        resolve(self);
                    } catch (e) {
                        winston.error(e.stack);
                        reject(e);
                    }
                }();
                async.next();
            });
        }

        assetPath(guid) {
            var folder = guid.substr(0,FOLDER_PREFIX);
            return path.join(this.assetDir, 'objects', folder, guid);
        }

        loadAsset(guid) {
            return new Promise((resolve, reject) => {
                var assetPath = this.assetPath(guid);
                if (!fs.existsSync(assetPath)) {
                    var err = new Error(`Inventory.loadAsset() no asset:${assetPath}`);
                    winston.error(err.stack);
                    return reject(err);
                }
                fs.readFile(assetPath, (err, data) => {
                    if (err) {
                        winston.error(err.stack);
                        return reject(err);
                    }
                    var json = JSON.parse(data);
                    var asset = this.assetOf(json);
                    this.assetMap[asset.guid] = asset;
                    resolve(asset);
                });
            });
        }

        saveAsset(asset) {
            if (asset == null) {
                var e = new Error(`Inventory.saveAsset() asset is required`);
                winston.warn(e.stack);
                return Promise.reject(e);
            }
            if (!this.isOpen) {
                var e = new Error("Inventory.saveAsset() inventory must be open()'d");
                winston.warn(e.stack);
                return Promise.reject(e);
            }
            if (!(asset instanceof Asset)) {
                try {
                    asset = this.assetOf(asset);
                } catch (e) {
                    winston.error(e.stack);
                    return Promise.reject(e);
                }
            }
            var guid = asset.guid;
            if (typeof guid !== 'string') {
                return Promise.reject(new Error(`Expected string for asset guid:${guid}`));
            }
            if (guid.length < 5) {
                return Promise.reject(new Error(`Invalid guid:${guid}`));
            }
            return new Promise((resolve, reject) => {
                try {
                    var assetPath = this.assetPath(guid);
                    if (!fs.existsSync(assetPath)) {
                        var folderPath = path.dirname(assetPath);
                        if (!fs.existsSync(folderPath)) {
                            var objectsPath = path.dirname(folderPath);
                            if (!fs.existsSync(objectsPath)) {
                                var assetDir = path.dirname(objectsPath);
                                if (!fs.existsSync(assetDir)) {
                                    fs.mkdirSync(assetDir);
                                }
                                fs.mkdirSync(objectsPath);
                            }
                            fs.mkdirSync(folderPath);
                        }
                    }
                    var json = JSON.stringify(asset, null, 2);
                    fs.writeFile(assetPath, json, (err) => {
                        if (err) {
                            winston.error(assetPath, err.stack);
                            return reject(err);
                        }
                        this.assetMap[guid] = asset;
                        winston.info(`Inventory.saveAsset() saved asset guid:${asset.guid}`);
                        resolve(asset);
                    });
                } catch (e) {
                    winston.error(e.stack);
                    reject(e);
                }
            });
        }

        close() {
            var self = this;
            return new Promise((resolve,reject) => {
                winston.warn(`Inventory.close() closed`);
                this.isOpen = false;
                resolve(self);
            });
        }

        assetOf(asset) {
            if (asset instanceof Asset) {
                return asset;
            }
            if (asset.type === Asset.T_PLANT) {
                return new Plant(asset);
            } 
            if (Asset.assetTypes().indexOf(asset.type) < 0) {
                throw new Error(`Inventory.assetOf() invalid asset type:${asset.type}`);
            }

            return new Asset(asset);
        }

        assetOfGuid(guid) {
            if (!this.isOpen) {
                var e = new Error("Inventory.assetOfGuid() inventory must be open()'d");
                winston.warn(e.stack);
                return Promise.reject(e);
            }
            var asset =  this.assetMap[guid];
            return asset;
        }

        assetOfId(id, t=new Date()) {
            var self = this;
            if (!self.isOpen) {
                var e = new Error("Inventory.assetOfId() inventory must be open()'d");
                winston.warn(e.stack);
                return Promise.reject(e);
            }
            if (id == null) {
                var e = new Error("id is required");
                winston.warn(e.stack);
                return Promise.reject(e);
            }
            return new Promise((resolve, reject) => {
                var async = function*() {
                    try {
                        var tvf = new Filter.TValueFilter(Filter.OP_EQ, {
                            tag: TValue.T_ID,
                            value: id,
                            t,
                        });
                        var assets = self.assets(tvf);
                        if (assets.length > 1) {
                            throw new Error(`Data integrity error: ${assets.length} assets have same id: ${id}`);
                        }
                        resolve(assets[0] || null);
                    } catch(e) {
                        winston.error(e.stack);
                        reject(e);
                    }
                }();
                async.next();
            });
        }

        assets(filter) {
            // TODO: Promise
            if (!this.isOpen) {
                var e = new Error("Inventory.assets() inventory must be open()'d");
                winston.warn(e.stack);
                throw e;
            }
            //var guids = Object.keys(this.assetMap).sort();
            var guids = Object.keys(this.assetMap);
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

    }

    module.exports = exports.Inventory = Inventory;
})(typeof exports === "object" ? exports : (exports = {}));

