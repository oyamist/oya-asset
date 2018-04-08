(typeof describe === 'function') && describe("Inventory", function() {
    const winston = require('winston');
    const should = require("should");
    const {
        Asset,
        TValue,
        Filter,
        Inventory,
        Plant,
    } = require("../index");
    const fs = require('fs');
    const path = require('path');
    const child_process = require('child_process');
    const inventoryPath = path.join(__dirname, '..', 'local', 'test-inventory');
    const local = path.join(__dirname, '..', 'local');
    const sampleInventory = path.join(__dirname, 'sample-inventory.json');
    winston.level = 'warn';

    it("Inventory(opts) creates an asset inventory", function(done) {
        var async = function*() {
            var iv = new Inventory();
            should(iv.inventoryPath).equal(path.join(local, 'assets'));
            done();
        }();
        async.next();
    });
    it("saveAsset(asset) and loadAsset(guid) handle asset files", function(done) {
        var async = function*() {
            try {
                if (fs.existsSync(inventoryPath)) {
                    var cmd = `rm -rf ${inventoryPath}`;
                    child_process.execSync(cmd);
                }
                var iv = new Inventory({
                    inventoryPath,
                });
                yield iv.open().then(r=>async.next(r)).catch(e=>done(e));
                var plant1 = new Plant({
                    name: 'plant1',
                });
                // save asset
                var asset = yield iv.saveAsset(plant1).then(r=>async.next(r)).catch(e=>done(e));
                should(asset).equal(plant1);
                var asset = yield iv.assetOfGuid(plant1.guid).then(r=>async.next(r)).catch(e=>done(e));
                should.deepEqual(asset, plant1);

                // loadAsset reads asset from disk
                var asset = yield iv.loadAsset(plant1.guid).then(r=>async.next(r)).catch(e=>done(e));
                should.deepEqual(asset, plant1);

                // if we remove the file, it won't load
                fs.unlinkSync(iv.assetPath(plant1.guid));
                winston.warn('EXPECTED ERROR: BEGIN');
                var r = yield iv.loadAsset(plant1.guid).then(r=>async.next(r)).catch(e=>async.next(e));
                winston.warn('EXPECTED ERROR: END');
                should(r).instanceOf(Error);
                should(r.message).match(/.*no asset.*/);
                
                done();
            } catch(e){
                done(e);
            }
        }();
        async.next();
    });
    it("is serializable", function(done) {
        (async function() {
            try {
                if (fs.existsSync(inventoryPath)) {
                    var cmd = `rm -rf ${inventoryPath}`;
                    child_process.execSync(cmd);
                }
                var iv = new Inventory({
                    inventoryPath,
                });
                await iv.open();
                var plant1 = new Plant({
                    name: 'plant1',
                    plant: Plant.P_TOMATO,
                    cultivar: Plant.C_CHOCOLATE_STRIPES,
                });
                var asset = await iv.saveAsset(plant1);

                var json = JSON.parse(JSON.stringify(iv));
                var ivcopy = new Inventory(json);
                var asset = await iv.assetOfGuid(plant1.guid);
                should.deepEqual(asset, plant1);

                done();
            } catch (e) {done(e);}
        })();
    });
    it("TESTTESTassets(filter) returns iterator for matching assets", function(done) {
        (async function() {
            try {
                var iv = new Inventory({
                    inventoryPath
                });
                await iv.open();
                var t1 = new Date(2018,1,1);
                var t2 = new Date(2018,1,2);
                var plant1 = new Plant({
                    name: 'plant1',
                    plant: Plant.P_TOMATO,
                    cultivar: Plant.C_CHOCOLATE_STRIPES,
                    id: 'A1001',
                    guid: 'GUID1001',
                });
                should(plant1.id).equal('A1001');
                plant1.set(TValue.T_ID, 'A1004', t2);
                should(plant1.id).equal('A1004');
                var plant2 = new Plant({
                    name: 'plant2',
                    id: 'A1002',
                    guid: 'GUID1002',
                });
                var tent1 = new Asset({
                    name: 'tent1',
                    type: Asset.T_ENCLOSURE,
                    id: 'A1003',
                    guid: 'GUID1003',
                });
                var asset = await iv.saveAsset(plant1);
                var asset = await iv.saveAsset(plant2);
                var asset = await iv.saveAsset(tent1);

                // match current id
                var tvf = new Filter.TValueFilter(Filter.OP_EQ, {
                    tag: TValue.T_ID,
                    value: 'A1004',
                });
                should(tvf.matches(plant1)).equal(true);
                should(tvf.matches(plant2)).equal(false);
                var assets = [...iv.assets(tvf)];
                should.deepEqual(assets.map(a=>a.name),[plant1.name]);

                // match current id
                var tvf = new Filter.TValueFilter(Filter.OP_EQ, {
                    tag: TValue.T_ID,
                    value: 'A1002',
                });
                should(tvf.matches(plant2)).equal(true);
                should(tvf.matches(plant1)).equal(false);
                var assets = [...iv.assets(tvf)];
                should.deepEqual(assets, [plant2]);

                // match historical id
                var tvf = new Filter.TValueFilter(Filter.OP_EQ, {
                    tag: TValue.T_ID,
                    value: 'A1001',
                    t: t1,
                });
                should(tvf.matches(plant1)).equal(true);
                should(tvf.matches(plant2)).equal(false);
                var assets = [...iv.assets(tvf)];
                should.deepEqual(assets, [plant1]);

                done();
            } catch (e) {done(e);}
        })();
    });
    it("assetOf(asset) is an asset factory", function() {
        var iv = new Inventory();
        var t1 = new Date(2018, 1, 2);
        var asset = iv.assetOf({
            begin: t1,
            type: "plant",
            plant: "tomato",
            cultivar: "Chocolate Stripes",
            guid:"GUID001",
            name: "Tomato1",
            id: "A0001",
            tvalues:[{
                tag: "location",
                t: "2018-03-12T00:00:00Z",
                value:"GUID003"
            }]
        });
        should(asset).instanceOf(Plant);
        should(asset.get(Plant.T_PLANT)).equal('tomato');
        should(asset.get(Plant.T_CULTIVAR)).equal('Chocolate Stripes');
        should.deepEqual(asset.snapshot(), {
            begin: t1.toJSON(),
            end: null,
            type: "plant",
            plant: "tomato",
            cultivar: "Chocolate Stripes",
            guid:"GUID001",
            name: "Tomato1",
            id: "A0001",
            location: "GUID003",
        });
    });
    it("guidify(snapshot) updates id references to guids", function(done) {
        (async function() { try {
            var iv = new Inventory({
                inventoryPath,
            });
            var a1 = new Asset({
                id: "A0001",
            });
            await iv.open();
            var asset = await iv.saveAsset(a1);
            should(iv.idGuidCache.entryOf(a1.id)).properties({
                obj: a1.guid,
            });
            var snapshot = a1.snapshot();
            snapshot.test = 'A0001'; 
            var snapshotExpected = Object.assign({}, snapshot, {
                test: a1.guid,
            });
            should.deepEqual(iv.guidify(snapshot), snapshotExpected);

            // guidify is only effective for cached ids
            iv.idGuidCache.clear();
            should.deepEqual(iv.guidify(snapshot), snapshot); // no substitution

            done();
        } catch(e){done(e)} })();
    });
    it("open(path) opens existing inventory", function(done) {
        var async = function *() {
            try {
                if (fs.existsSync(inventoryPath)) {
                    var cmd = `rm -rf ${inventoryPath}`;
                    child_process.execSync(cmd);
                }
                var iv = new Inventory({
                    inventoryPath,
                });
                should(iv.isOpen).equal(false);
                var r = yield iv.open().then(r=>async.next(r)).catch(e=>async.throw(e));
                should(iv.isOpen).equal(true);
                should(r).equal(iv);
                yield iv.import(sampleInventory).then(r=>async.next(r)).catch(e=>async.throw(e));
                var r = yield iv.close().then(r=>async.next(r)).catch(e=>async.throw(e));;
                should(r).equal(iv);

                iv2 = new Inventory({
                    inventoryPath,
                });
                var r = yield iv2.open().then(r=>async.next(r)).catch(e=>async.throw(e));
                var a1 = yield iv2.assetOfId('A0001').then(r=>async.next(r))
                    .catch(e=>done(e));
                should(a1).instanceOf(Asset);
                should(a1.name).equal('Tomato1');

                done();
            } catch(e) {
                done(e);
            }
        }();
        async.next();
    });
    it("saveAsset(asset) saves an asset", function(done) {
        var async = function*() {
            try {
                var guid = 'GUID_tent1';
                var assetPath = path.join(inventoryPath, `objects`, `${guid.substr(0,2)}`,`${guid}`);
                var t1 = new Date(2018, 1, 2);
                if (fs.existsSync(assetPath)) {
                    fs.unlinkSync(assetPath);
                }
                var asset = new Asset({
                    name: 'tent1',
                    type: Asset.T_ENCLOSURE,
                    guid,
                });
                var iv = new Inventory({
                    inventoryPath,
                });
                yield(iv.open()).then(r=>async.next(r)).catch(e=>done(e));
                var r = yield iv.saveAsset(asset).then(r=>async.next(r)).catch(e=>done(e));
                should.deepEqual(r, asset);
                should(fs.existsSync(assetPath)).equal(true);
                should(iv.assetPath(guid)).equal(assetPath);
                done();
            } catch(e) {
                done(e);
            }
        }();
        async.next();
    });
    it("loadAsset(guid) load an asset", function(done) {
        var async = function*() {
            try {
                var guid = 'GUID001';
                var iv = new Inventory({
                    inventoryPath,
                });
                yield iv.open().then(r=>async.next(r)).catch(e=>done(e));
                yield iv.import(sampleInventory).then(r=>async.next(r)).catch(e=>done(e));
                var asset = yield iv.loadAsset(guid).then(r=>async.next(r)).catch(e=>done(e));
                should(asset).instanceOf(Asset);
                should(asset).properties({
                    guid,
                    name: 'Tomato1',
                    type: Asset.T_PLANT,
                });
                done();
            } catch(e) {
                done(e);
            }
        }();
        async.next();
    });
    it("assetCount() returns number of assets", function(done) {
        var async = function*() {
            try {
                var iv = new Inventory({
                    inventoryPath,
                });
                should.throws(() => iv.assetCount());
                yield iv.open().then(r=>async.next(r)).catch(e=>done(e));

                // preceding tests should have created some assets
                should(iv.assetCount()).above(0);

                done();
            } catch(e) {
                done(e);
            }
        }();
        async.next();
    });
    it("enerator", function(done) {
        var sum = Inventory.asyncGenerator(function*(data) {
            var result = 0;
            for (let d of data) {
                result += yield Promise.resolve(d);
            };
            return result; // return after all yields are handled
        });
        sum([1,2,3]).then(v => {
            should(v).equal(6);
            done();
        }).catch(e=>done(e));
    });
    it("guids(ivpath) returns iterator over all asset guids", function(done) {
        (async function() { try{
            var iv = new Inventory({
                inventoryPath,
            });
            var r = await iv.open();
            var r = await iv.import(sampleInventory);
            should(iv.guids()).iterable();
            var guids = [...iv.guids()];
            should.deepEqual(guids.sort(), [
                'GUID001',
                'GUID002',
                'GUID003',
                'GUID004',
                'GUID_tent1',
            ].sort());

            // inventory path can be specified
            should.deepEqual([...iv.guids(inventoryPath)], guids);

            // error handling
            should.throws(()=>iv.guids('badpath'));

            done();
        } catch(e){done(e);} })();
    });
    it("TESTTESTisDirty is true if inventory has changed", function(done) {
        (async function(){ try {
            var iv = new Inventory({
                inventoryPath,
            });

            // A newly opened inventory is not dirty
            var r = await iv.open();
            should(iv.isDirty).equal(false);

            // Adding a new asset will mark inventory as dirty
            var plant = new Plant({
                name: 'testdirty',
            });
            var asset = await iv.saveAsset(plant);
            should(iv.isDirty).equal(true);
            var asset = await iv.assetOfId(plant.id);
            should.deepEqual(asset, plant);

            // clear cache
            iv.guidAssetCache.clear();
            iv.idGuidCache.clear();
            iv.isDirty = false;
            should(iv.isDirty).equal(false);
            var asset = await iv.assetOfId(plant.id);
            should.deepEqual(asset, plant);
            should(iv.isDirty).equal(true);

            done();
        } catch (e) {done(e)} })();
    });
    it("cacheSize property determines working set size", function() {
        var iv = new Inventory();
        should(iv.cacheSize).equal(1000);
        iv.cacheSize = 2000;
        should(iv.cacheSize).equal(2000);
        should(iv.guidAssetCache.maxSize).equal(2000);
        should(iv.idGuidCache.maxSize).equal(2000);

        var json = JSON.parse(JSON.stringify(iv));
        var iv2 = new Inventory(json);
        should(iv2.cacheSize).equal(2000);
        should(iv2.guidAssetCache.maxSize).equal(2000);
        should(iv2.idGuidCache.maxSize).equal(2000);
    });
    it("ssetOfIdExhaustive(id) searches all assets for first one with id", function(done) {
        (async function() { try {
            var iv = new Inventory({
                inventoryPath,
            });
            await iv.open();
            await iv.import(sampleInventory);
            var asset = await iv.assetOfIdExhaustive('A0002');
            var a0002 = await iv.loadAsset('GUID002');
            should.deepEqual(asset,a0002);
            done();
        } catch(e){done(e)} })();
    });
    it("ssetOfId(id) returns asset of id", function(done) {
        (async function() { try {
            var iv = new Inventory({
                inventoryPath,
            });
            await iv.open();
            await iv.import(sampleInventory);
            iv.idGuidCache.clear();
            should(iv.idGuidCache.entryOf('A0002')).equal(undefined);
            var asset = await iv.assetOfIdExhaustive('A0002');
            should(iv.idGuidCache.entryOf('A0002')).equal(undefined);
            var a0002 = await iv.loadAsset('GUID002');
            should.deepEqual(asset,a0002);
            done();
        } catch(e){done(e)} })();
    });

})
