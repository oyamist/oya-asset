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

    it("Inventory(opts) creates an asset inventory", function() {
        var iv = new Inventory();
        should(typeof iv.assetMap).equal('object');
        should(Object.keys(iv.assetMap).length).equal(0);
    });
    it("addAsset(asset) adds asset to inventory", function() {
        var iv = new Inventory();
        var plant1 = new Plant({
            name: 'plant1',
        });
        var plant2 = new Plant({
            name: 'plant2',
        });
        var tent1 = new Asset({
            name: 'tent1',
            type: Asset.T_ENCLOSURE,
        });
        var asset = iv.addAsset(plant1);
        should(asset).equal(plant1);
        var asset = iv.addAsset(plant2);
        should(asset).equal(plant2);
        var asset = iv.addAsset(tent1);
        should.deepEqual(iv.assetOfGuid(plant1.guid), plant1);
        should.deepEqual(iv.assetOfGuid(plant2.guid), plant2);
        should.deepEqual(iv.assetOfGuid(tent1.guid), tent1);

        var json = JSON.parse(JSON.stringify(iv));
        var iv2 = new Inventory(json);
        should.deepEqual(iv2, iv);
        should.deepEqual(iv2.assetOfGuid(plant1.guid), plant1);
        should.deepEqual(iv2.assetOfGuid(plant2.guid), plant2);
        should.deepEqual(iv2.assetOfGuid(tent1.guid), tent1);
        should(iv2.assetOfGuid(tent1.guid).name).equal('tent1');
        
    });
    it("Inventory is serializable", function() {
        var iv = new Inventory();
        var plant1 = new Plant({
            name: 'plant1',
            plant: Plant.P_TOMATO,
            cultivar: Plant.C_CHOCOLATE_STRIPES,
        });
        var plant2 = new Plant({
            name: 'plant2',
        });
        var tent1 = new Asset({
            name: 'tent1',
            type: Asset.T_ENCLOSURE,
        });
        iv.addAsset(plant1);
        iv.addAsset(plant2);
        iv.addAsset(tent1);
        should(iv.assetMap[plant1.guid]).equal(plant1);

        var json = JSON.parse(JSON.stringify(iv));
        var ivcopy = new Inventory(json);
        should.deepEqual(ivcopy, iv);
        should(ivcopy.assetMap[plant1.guid]).instanceOf(Plant);
    });
    it("assets(filter) returns matching assets", function() {
        var iv = new Inventory();
        var t1 = new Date(2018,1,1);
        var t2 = new Date(2018,1,2);
        var plant1 = new Plant({
            name: 'plant1',
            plant: Plant.P_TOMATO,
            cultivar: Plant.C_CHOCOLATE_STRIPES,
            id: 'A0001',
        });
        should(plant1.id).equal('A0001');
        plant1.set(TValue.T_ID, 'A0004', t2);
        should(plant1.id).equal('A0004');
        var plant2 = new Plant({
            name: 'plant2',
            id: 'A0002',
        });
        var tent1 = new Asset({
            name: 'tent1',
            type: Asset.T_ENCLOSURE,
            id: 'A0003',
        });
        iv.addAsset(plant1);
        iv.addAsset(plant2);
        iv.addAsset(tent1);

        // match current id
        var tvf = new Filter.TValueFilter(Filter.OP_EQ, {
            tag: TValue.T_ID,
            value: 'A0004',
        });
        should(tvf.matches(plant1)).equal(true);
        should(tvf.matches(plant2)).equal(false);
        var assets = iv.assets(tvf);
        should(assets.length).equal(1);
        should(assets[0]).equal(plant1);

        // match current id
        var tvf = new Filter.TValueFilter(Filter.OP_EQ, {
            tag: TValue.T_ID,
            value: 'A0002',
        });
        should(tvf.matches(plant2)).equal(true);
        should(tvf.matches(plant1)).equal(false);
        var assets = iv.assets(tvf);
        should(assets.length).equal(1);
        should(assets[0]).equal(plant2);

        // match historical id
        var tvf = new Filter.TValueFilter(Filter.OP_EQ, {
            tag: TValue.T_ID,
            value: 'A0001',
            t: t1,
        });
        should(tvf.matches(plant1)).equal(true);
        should(tvf.matches(plant2)).equal(false);
        var assets = iv.assets(tvf);
        should(assets.length).equal(1);
        should(assets[0]).equal(plant1);
    });
    it("assetOf(asset) is an asset factor", function() {
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
    it("guidify(snapshot) updates id references to guids", function() {
        var iv = new Inventory();
        var a1 = new Asset({
            id: "A0001",
        });
        iv.addAsset(a1);
        var snapshot = a1.snapshot();
        snapshot.test = 'a0001'; // ignores case
        should.deepEqual(iv.guidify(snapshot), Object.assign({}, snapshot, {
            test: a1.guid,
        }));
    });
    it("open(path) opens existing inventory", function(done) {
        var async = function *() {
            try {
                var local = path.join(__dirname, '..', 'local');
                var ivpath = path.join(__dirname, '..', 'test', 'test-inventory.json');
                fs.existsSync(ivpath) && fs.unlinkSync(ivpath);
                var iv = new Inventory({
                    assetDir: path.join(__dirname, '..', 'local', 'test-assets'),
                });
                should(iv.isOpen).equal(false);
                var r = yield iv.open(ivpath).then(r=>async.next(r)).catch(e=>async.throw(e));
                should(iv.isOpen).equal(true);
                should(r).equal(iv);
                should(fs.existsSync(ivpath)).equal(true);
                var json = JSON.parse(fs.readFileSync(ivpath));
                should.deepEqual(json, {
                    type: 'Inventory',
                    assetMap: {},
                    assetDir: path.join(local, 'test-assets'),
                });

                iv.addAsset({
                    type: 'plant',
                    id: 'A0001',
                    name: 'tomato01',
                    guid: 'GUID_A0001',
                    size: 'large',
                });
                var r = yield iv.commit().then(r=>async.next(r)).catch(e=>async.throw(e));
                should(r).equal(iv);

                var r = yield iv.close().then(r=>async.next(r)).catch(e=>async.throw(e));;
                should(r).equal(iv);

                iv = new Inventory({
                    ivpath,
                });
                var r = yield iv.open().then(r=>async.next(r)).catch(e=>async.throw(e));
                should(r).equal(iv);

                var a1 = iv.assetOfId('A0001');
                should(a1.name).equal('tomato01');
                should(iv.assetOfGuid(a1.guid)).equal(a1);
                should(a1.id).equal('A0001');
                should(a1.size).equal('large');

                var r = yield iv.close().then(r=>async.next(r)).catch(e=>async.throw(e));;
                should(r).equal(iv);

                done();
            } catch(e) {
                done(e);
            }
        }();
        async.next();
    });
    it("commit(backup) saves a backup to archive directory", function(done) {
        var async = function *() {
            try {
                var ivpath = path.join(__dirname, '..', 'test', 'test-inventory.json');
                fs.existsSync(ivpath) && fs.unlinkSync(ivpath);
                var iv = new Inventory({
                    ivpath,
                });

                // open() must be called before commit()
                var level = winston.level;
                winston.level = 'error';
                var r = yield iv.commit(true).then(r=>async.throw("unexpected")).catch(e=>async.next(e));
                winston.level = level;
                should(r.message).match(/must be open/);

                var r = yield iv.open().then(r=>async.next(r)).catch(e=>async.throw(e));
                var r = yield iv.commit(true).then(r=>async.next(r)).catch(e=>async.throw(e));

                // verify backup
                var date = new Date().toJSON().split('T')[0];
                var backupPath = path.join(__dirname, 'archive', `test-inventory-${date}.json`);
                should(fs.existsSync(backupPath)).equal(true);
                var json = JSON.parse(fs.readFileSync(backupPath));
                should.deepEqual(json, JSON.parse(JSON.stringify(iv)));

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
                var testAssetDir = path.join(__dirname, '..', 'local', 'test-assets');
                var guid = 'GUID_tent1';
                var assetPath = path.join(testAssetDir, `${guid}.json`);
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
                    assetDir: testAssetDir, 
                });
                var r = yield iv.saveAsset(asset).then(r=>async.next(r)).catch(e=>async.throw(e));
                should(r).equal(true);
                should(fs.existsSync(assetPath)).equal(true);
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
                var testAssetDir = path.join(__dirname, '..', 'local', 'test-assets');
                var guid = 'GUID_tent1';
                var assetPath = path.join(testAssetDir, `${guid}.json`);
                var iv = new Inventory({
                    assetDir: testAssetDir, 
                });
                var asset = yield iv.loadAsset(guid).then(r=>async.next(r)).catch(e=>async.throw(e));
                should(asset).instanceOf(Asset);
                should(asset).properties({
                    guid,
                    name: 'tent1',
                    type: Asset.T_ENCLOSURE,
                });
                done();
            } catch(e) {
                done(e);
            }
        }();
        async.next();
    });
})
