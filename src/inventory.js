(function(exports) {
    const Asset = require('./asset');
    const Plant = require('./plant');
    const Filter = require('./filter');
    const TValue = require('./tvalue');
    const fs = require('fs');
    const path = require('path');
    const winston = require('winston');
    const MerkleJson = require('merkle-json').MerkleJson;
    var mj = new MerkleJson();

    class Inventory {
        constructor(opts={}) {
            var local = path.join(__dirname, '..', 'local');
            if (!fs.existsSync(local)) {
                fs.mkdirSync(local);
            }
            Object.defineProperty(this, 'ivpath', {
                writable: true,
                value: path.join(local, 'assets', 'inventory.json'),
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
            this.assetDir = opts.assetDir || path.join(local, 'assets');
            if (!fs.existsSync(this.assetDir)) {
                winston.info(`Inventory.update() creating assets directory: ${this.assetDir}`);
                fs.mkdirSync(this.assetDir);
            }
            this.ivpath = opts.ivpath || this.ivpath;
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

        save(savePath=this.ivpath, backup=true) {
            return new Promise((resolve, reject) => {
                try {
                    var indent = savePath.match(/test-/) ? 2 : 0;
                    var json =JSON.stringify(this,undefined,indent);
                    var saveJson = () => {
                        fs.writeFile(savePath, json, (e) => {
                            if (e) {
                                winston.error(stack); 
                                reject(e); 
                                return;
                            }
                            resolve(this);
                        });
                    };
                    if (backup) {
                        var archivePath = path.join(path.dirname(savePath), 'archive');
                        if (!fs.existsSync(archivePath)) {
                            fs.mkdirSync(archivePath);
                        }
                        var yyyymmdd = new Date().toJSON().split('T')[0];
                        var backupPrefix = path.basename(savePath).split('.')[0];
                        var backupFile = `${backupPrefix}-${yyyymmdd}.json`;
                        var backupPath = path.join(archivePath, backupFile);
                        this.save(backupPath, false).catch(e=>e); // error already handled
                        fs.writeFile(backupPath, json, (e) => {
                            if (e) {
                                winston.error(stack); 
                                reject(e); 
                                return;
                            } 
                            saveJson();
                        });
                    } else {
                        saveJson();
                    }
                } catch (e) {
                    winston.error(e.stack);
                    reject(e);
                }
            });
        }

        open(ivpath=this.ivpath) {
            if (this.isOpen) {
                return Promise.resolve(this);
            }
            return new Promise((resolve, reject) => {
                var self = this;
                var async = function*() {
                    try {
                        var r = null;
                        r = yield fs.readdir(self.assetDir, (err, files) => {
                            async.next(err || files);
                        });
                        if (r instanceof Error) {
                            throw r;
                        }
                        var files = r || [];
                        r = null;
                        for (var i = 0; i < files.length; i++) {
                            var guid = files[i].split('.json')[0];
                            r = yield self.loadAsset(guid).then(r=>async.next(r)).catch(e=>async.next(e));
                            if (r instanceof Error) {
                                throw r;
                            }
                            r = null;
                        }

                        if (r == null) {
                            self.ivpath = ivpath;
                            if (fs.existsSync(ivpath)) {
                                var r = yield fs.readFile(ivpath, (e,data) => {
                                    if (e) {
                                        async.next(e);
                                    } else {
                                        try {
                                            var json = JSON.parse(data);
                                            self.update(json);
                                            self.isOpen = true;
                                            async.next(self);
                                        } catch (e) {
                                            winston.error(e.stack);
                                            async.next(e);
                                        }
                                    }
                                });
                            } else {
                                var r = yield self.save(ivpath).then(r=> {
                                    self.isOpen = true;
                                    var r = self;
                                    async.next(self);
                                }).catch(e=>async.next(e));
                            }
                        }
                        if (r instanceof Error) {
                            throw r;
                        }
                        resolve(self);
                    } catch (e) {
                        winston.error(e.stack);
                        reject(e);
                    }
                }();
                async.next();
            });
        }

        commit(backup=true) {
            if (!this.isOpen) {
                var e = new Error("Inventory.commit() inventory must be open()'d");
                winston.warn(e.stack);
                return Promise.reject(e);
            }
            return new Promise((resolve, reject) => {
                try {
                    this.assets().forEach(asset => {
                        this.saveAsset(asset);
                    });
                    this.save(this.ivpath,backup).then(r=>resolve(this)).catch(e=>reject(e));
                } catch (e) {
                    winston.error(e.stack);
                    reject(e);
                }
            });
        }

        loadAsset(guid) {
            return new Promise((resolve, reject) => {
                var assetPath = path.join(this.assetDir, `${guid}.json`);
                if (!fs.existsSync(assetPath)) {
                    var err = new Error(`Inventory.loadAsset() no asset with guid:${guid}`);
                    winston.error(err.stack);
                    return reject(err);
                }
                fs.readFile(assetPath, (err, data) => {
                    if (err) {
                        winston.error(err.stack);
                        return reject(err);
                    }
                    var json = JSON.parse(data);
                    resolve(new Asset(json));
                });
            });
        }

        saveAsset(asset) {
            if (!(asset instanceof Asset)) {
                var err = new Error(`Inventory.saveAsset() eapected:Asset actual:${JSON.stringify(asset)}`);
                return Promise.reject(err);
            }
            return new Promise((resolve, reject) => {
                try {
                    var assetPath = path.join(this.assetDir, `${asset.guid}.json`);
                    var json = JSON.stringify(asset, null, 2);
                    fs.writeFile(assetPath, json, (err) => {
                        if (err) {
                            winston.error(assetPath, err.stack);
                            return promise.reject(err);
                        }
                        resolve(true);
                    });
                } catch (e) {
                    winston.error(e.stack);
                    reject(e);
                }
            });
        }

        close() {
            var promise = this.commit();
            promise.then(r=>{
                this.isOpen = false;
            });
            return promise;
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
            var asset =  this.assetMap[guid];
            return asset;
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

