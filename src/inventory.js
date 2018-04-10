(function(exports) {
    const Asset = require('./asset');
    const Plant = require('./plant');
    const Cache = require('./cache');
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
            Object.defineProperty(this, 'isDirty', {
                writable: true,
                value: false,
            });
            Object.defineProperty(this, 'isOpen', {
                writable: true,
                value: false,
            });
            this.type = 'Inventory';

            this.update(opts);
        }

        static asyncGenerator(makeGen){
            return function (...args) {
                var gen = makeGen.apply(this, args);
                function handle(result){
                    return result.done
                        ? Promise.resolve(result.value)
                        : Promise.resolve(result.value)
                            .then(r=>handle(gen.next(r)))
                            .catch(e=>handle(gen.throw(e)));
                }

                try {
                    return handle(gen.next());
                } catch (ex) {
                    return Promise.reject(ex);
                }
            }
        }

        get cacheSize() {
            return Math.min( this.guidAssetCache.maxSize, this.idGuidCache.maxSize);
        }

        set cacheSize(value) {
            this.guidAssetCache.maxSize = value;
            this.idGuidCache.maxSize = value;
            this.isDirty = true;
        }

        update(opts={}) {
            var self = this;
            var local = path.join(__dirname, '..', 'local');
            this.inventoryPath = opts.inventoryPath ||  path.join(local, 'assets');
            if (!fs.existsSync(this.inventoryPath)) {
                winston.info(`Inventory.update() creating assets directory: ${this.inventoryPath}`);
                fs.mkdirSync(this.inventoryPath);
            }
            if (opts.guidAssetCache instanceof Cache) {
                this.guidAssetCache = opts.guidAssetCache;
            } else {
                this.guidAssetCache = new Cache(Object.assign({
                    fetch: guid=>{
                        return new Promise((resolve,reject) => {
                            self.loadAsset(guid).then(r=>resolve(r.snapshot()))
                                .catch(e=>reject(e));
                        });
                    },
                }, opts.guidAssetCache));
            }
            if (opts.idGuidCache instanceof Cache) {
                this.idGuidCache = opts.idGuidCache;
            } else {
                this.idGuidCache =  new Cache(Object.assign({
                }, opts.idGuidCache));
            }
            return undefined; // TBD
        }

        assetCount() {
            if (!this.isOpen) {
                throw new Error(`Inventory.assetCount() inventory must be open()'d`);
            }
            return [...this.guids()].length;
        }

        import(ivpath) {
            if (!this.isOpen) {
                var e = new Error("Inventory.import() inventory must be open()'d");
                winston.warn(e.stack);
                return Promise.reject(e);
            }
            var ereject = new Error(`Inventory.import() no file:${ivpath}`);
            if (!fs.existsSync(ivpath)) {
                return Promise.reject(ereject);
            }
            var self = this;
            return new Promise((resolve, reject) => {
                winston.info(`Inventory.import() file:${ivpath}`);
                fs.readFile(ivpath, (e,data) => {
                    if (e) {
                        winston.error(e.message, ereject.stack);
                        return reject(e);
                    } 
                    (async function() {
                        try {
                            var assets = JSON.parse(data);
                            for (let assetJson of assets) {
                                var asset = self.assetOf(assetJson);
                                asset && self.guidAssetCache.put(asset.guid, asset.snapshot());
                                await self.saveAsset(asset);
                            };
                            resolve(self);
                        } catch (e) {
                            winston.error(e.message, ereject.stack);
                            reject(e);
                        }
                    })();
                });
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
                        var objects = path.join(self.inventoryPath, 'objects');
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
                        self.isDirty = false;
                        winston.info(`Inventory.open() inventory path:${self.inventoryPath}`);
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
            if (typeof guid !== 'string') {
                var e = new Error(`Inventory.assetPath() invalid guid:${guid}`);
                throw e;
            }
            var folder = guid.substr(0,FOLDER_PREFIX);
            return path.join(this.inventoryPath, 'objects', folder, guid);
        }

        loadAssetSync(guid) {
            var assetPath = this.assetPath(guid);
            if (!fs.existsSync(assetPath)) {
                throw new Error(`Inventory.loadAsset() no asset:${assetPath}`);
            }
            var data = fs.readFileSync(assetPath);
            var json = JSON.parse(data);
            return this.assetOf(json);
        }

        loadAsset(guid, updateCache=true) {
            if (guid == null) {
                var err = new Error(`Inventory.loadAsset() no asset:${assetPath}`);
                return Promise.reject(err);
            }
            return new Promise((resolve, reject) => {
                try {
                    var asset = this.loadAssetSync(guid);
                    if (updateCache) {
                        this.isDirty = true;
                        this.guidAssetCache.put(guid, asset);
                        this.idGuidCache.put(asset.id, guid);
                    }
                    resolve(asset);
                } catch(e) {
                    winston.error(e.stack);
                    reject(e);
                }
            });
        }

       createAssetFolder(assetPath) {
            if (!fs.existsSync(assetPath)) {
                var folderPath = path.dirname(assetPath);
                if (!fs.existsSync(folderPath)) {
                    var objectsPath = path.dirname(folderPath);
                    if (!fs.existsSync(objectsPath)) {
                        var inventoryPath = path.dirname(objectsPath);
                        if (!fs.existsSync(inventoryPath)) {
                            fs.mkdirSync(inventoryPath);
                        }
                        fs.mkdirSync(objectsPath);
                    }
                    fs.mkdirSync(folderPath);
                }
            }
        }

        saveAsset(asset, updateCache=true) {
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
                    this.createAssetFolder(assetPath);
                    var json = JSON.stringify(asset, null, 2);
                    fs.writeFile(assetPath, json, (err) => {
                        if (err) {
                            winston.error(assetPath, err.stack);
                            return reject(err);
                        }
                        if (updateCache) {
                            this.isDirty = this.isDirty 
                                || !this.idGuidCache.entryOf(asset.id)
                                || !this.guidAssetCache.entryOf(guid);
                            this.guidAssetCache.put(guid, asset);
                            this.idGuidCache.put(asset.id, guid);
                        }
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
                winston.info(`Inventory.close() closed`);
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
            var entry = this.guidAssetCache.entryOf(guid);
            var asset = entry && entry.value;
            if (asset instanceof Asset) {
                return Promise.resolve(asset);
            }
            return this.loadAsset(guid);
        }

        assetOfIdExhaustive(id, t=new Date(), updateCache=false) {
            var self = this;
            var tvf = new Filter.TValueFilter(Filter.OP_EQ, {
                tag: TValue.T_ID,
                value: id,
                t,
            });

            return Inventory.asyncGenerator(function*() {
                var result = 0;
                for (let guid of self.guids()) {
                    var asset = yield self.loadAsset(guid, false);
                    if (tvf.matches(asset)) {
                        if (updateCache) {
                            self.idGuidCache.put(id, guid);
                            self.guidAssetCache.put(guid, asset);
                            self.isDirty = true;
                        }
                        return asset;
                    }
                };
                return null; 
            })();
        }

        assetOfId(id, t=new Date()) {
            var entry = this.idGuidCache.entryOf(id);
            var guid = entry && entry.value;
            if (guid) {
                return this.assetOfGuid(guid);
            }
            winston.info(`Inventory.assetOfId() idGuidCache missed id:${id} `);
            return this.assetOfIdExhaustive(id, t, true);
        }

        guids(ivpath = this.inventoryPath) {
            var objectsPath = path.join(ivpath, 'objects');
            if (!fs.existsSync(objectsPath)) {
                var err = new Error(`Inventory.guids() non-existent inventory:${ivpath}`);
                throw err;
            }
            return function*() {
                var folders = fs.readdirSync(objectsPath);
                for (let folder of folders) {
                    var files = fs.readdirSync(path.join(objectsPath, folder));
                    yield* files;
                }
            }();
        }

        assets(filter) {
            if (!this.isOpen) {
                var e = new Error("Inventory.assets() inventory must be open()'d");
                winston.warn(e.stack);
                throw e;
            }
            var self = this;
            var gen = function*() {
                for (let guid of self.guids()) {
                    var entry = self.guidAssetCache.entryOf(guid);
                    var cachedAsset = entry && entry.obj;
                    var asset = cachedAsset || self.loadAssetSync(guid);
                    if (filter) {
                        if (filter.matches(asset)) {
                            if (!cachedAsset) {
                                this.isDirty = true;
                                self.guidAssetCache.put(asset.guid, asset);
                                self.idAssetCache.put(asset.id, asset.guid);
                            }
                            yield asset;
                        }
                    } else {
                        yield asset;
                    }
                }
            }
            return gen();
        }

        guidify(snapshot) {
            return Object.keys(snapshot).reduce((acc,key) => {
                var value = snapshot[key];
                var entry = (typeof value === 'string') && this.idGuidCache.entryOf(value);
                var guid = entry && entry.obj;
                acc[key] = key !== 'id' && guid ? guid : value;
                return acc;
            }, {});
        }

    }

    module.exports = exports.Inventory = Inventory;
})(typeof exports === "object" ? exports : (exports = {}));

