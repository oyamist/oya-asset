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
    const assetDir = path.join(__dirname, '..', 'local', 'test-inventory');
    winston.level = 'warn';

    it("Inventory(opts) creates an asset inventory", function(done) {
        var async = function*() {
            var iv = new Inventory();
            should(typeof iv.assetMap).equal('object');
            should(iv.assetDir).equal(path.join(__dirname, '..', 'local', 'assets'));
            done();
        }();
        async.next();
    });
    it("saveAsset(asset) adds asset to inventory", function() {
        var async = function*() {
            var local = path.join(__dirname, '..', 'local');
            if (fs.existsSync(assetDir)) {
                var cmd = `rm -rf ${assetDir}`;
                console.log(cmd);
                child_process.execSync(cmd);
            }
            var iv = new Inventory({
                assetDir,
            });
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
            yield iv.open().then(r=>asnc.next(r)).catch(e=>done(e));
            var asset = yield iv.saveAsset(plant1).then(r=>async.next(r)).catch(e=>done(e));
            should(asset).equal(plant1);
            var asset = yield iv.saveAsset(plant2).then(r=>async.next(r)).catch(e=>done(e));
            should(asset).equal(plant2);
            var asset = yield iv.saveAsset(tent1).then(r=>async.next(r)).catch(e=>done(e));
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
            
        }();
        async.next();
    });
    it("Inventory is serializable", function() {
        var async = function*() {
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
            var asset = yield iv.saveAsset(plant1).then(r=>async.next(r)).catch(e=>done(e));
            var asset = yield iv.saveAsset(plant2).then(r=>async.next(r)).catch(e=>done(e));
            var asset = yield iv.saveAsset(tent1).then(r=>async.next(r)).catch(e=>done(e));
            should(iv.assetMap[plant1.guid]).equal(plant1);

            var json = JSON.parse(JSON.stringify(iv));
            var ivcopy = new Inventory(json);
            should.deepEqual(ivcopy, iv);
            should(ivcopy.assetMap[plant1.guid]).instanceOf(Plant);
        }();
        async.next();
    });
    it("TESTTESTassets(filter) returns iterator for matching assets", function(done) {
        var async = function*() {
            var iv = new Inventory({
                assetDir
            });
            yield(iv.open()).then(r=>async.next(r)).catch(e=>done(e));
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
            var asset = yield iv.saveAsset(plant1).then(r=>async.next(r)).catch(e=>done(e));
            var asset = yield iv.saveAsset(plant2).then(r=>async.next(r)).catch(e=>done(e));
            var asset = yield iv.saveAsset(tent1).then(r=>async.next(r)).catch(e=>done(e));

            // match current id
            var tvf = new Filter.TValueFilter(Filter.OP_EQ, {
                tag: TValue.T_ID,
                value: 'A1004',
            });
            should(tvf.matches(plant1)).equal(true);
            should(tvf.matches(plant2)).equal(false);
            var assets = [...iv.assets(tvf)];
            should.deepEqual(assets,[plant1]);

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
        }();
        async.next();
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
        var async = function*() {
            var iv = new Inventory({
                assetDir,
            });
            var a1 = new Asset({
                id: "A0001",
            });
            yield(iv.open()).then(r=>async.next(r)).catch(e=>done(e));
            var asset = yield iv.saveAsset(a1).then(r=>async.next(r)).catch(e=>done(e));
            var snapshot = a1.snapshot();
            snapshot.test = 'a0001'; // ignores case
            should.deepEqual(iv.guidify(snapshot), Object.assign({}, snapshot, {
                test: a1.guid,
            }));
            done();
        }();
        async.next();
    });
    it("open(path) opens existing inventory", function(done) {
        var async = function *() {
            try {
                var local = path.join(__dirname, '..', 'local');
                if (fs.existsSync(assetDir)) {
                    var cmd = `rm -rf ${assetDir}`;
                    console.log(cmd);
                    child_process.execSync(cmd);
                }
                var iv = new Inventory({
                    assetDir,
                });
                should(iv.isOpen).equal(false);
                var r = yield iv.open().then(r=>async.next(r)).catch(e=>async.throw(e));
                should(iv.isOpen).equal(true);
                should(r).equal(iv);

                var r = yield iv.saveAsset({
                    type: 'plant',
                    id: 'A0001',
                    name: 'tomato01',
                    guid: 'GUID_A0001',
                    size: 'large',
                }).then(r=>async.next(r)).catch(e=>done(e));
                var r = yield iv.close().then(r=>async.next(r)).catch(e=>async.throw(e));;
                should(r).equal(iv);

                iv2 = new Inventory({
                    assetDir,
                });
                var r = yield iv2.open().then(r=>async.next(r)).catch(e=>async.throw(e));
                should(r).equal(iv2);
                console.log(iv2.assetMap);

                var a1 = yield iv2.assetOfId('A0001').then(r=>async.next(r))
                    .catch(e=>done(e));
                should(a1).instanceOf(Asset);
                should(a1.name).equal('tomato01');
                should(iv2.assetOfGuid(a1.guid)).equal(a1);
                should(a1.id).equal('A0001');
                should(a1.size).equal('large');

                var r = yield iv2.close().then(r=>async.next(r)).catch(e=>async.throw(e));;
                should(r).equal(iv2);

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
                var assetPath = path.join(assetDir, `objects`, `${guid.substr(0,2)}`,`${guid}`);
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
                    assetDir,
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
                var guid = 'GUID_tent1';
                var iv = new Inventory({
                    assetDir,
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
    it("assetCount() returns number of assets", function(done) {
        var async = function*() {
            try {
                var iv = new Inventory({
                    assetDir,
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
    it("generator", function(done) {
        var generator = function*() {
            var i = 0;
            while (i < 10) {
                yield(i);
                i += 2;
            }
        }();
        var g = null;
        for (var i = 0; i < 10; i++) {
            g = generator.next();
            if (i*2 < 10) {
                should.deepEqual(g, {
                    value: i*2,
                    done: false,
                });
            } else {
                should.deepEqual(g, {
                    value: undefined,
                    done: true,
                });
            }
        }
        done();
    });
})
