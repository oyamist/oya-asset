(typeof describe === 'function') && describe("RbAsset", function() {
    const should = require("should");
    const winston = require('winston');
    const child_process = require('child_process');
    var level = winston.level;
    winston.level = 'warn';
    const srcPkg = require("../package.json");
    const supertest = require('supertest');
    const fs = require('fs');
    const APIMODEL_PATH = `api-model/${srcPkg.name}.test.json`;
    if (fs.existsSync(APIMODEL_PATH)) {
        fs.unlinkSync(APIMODEL_PATH);
    }
    const app = require("../scripts/server.js"); // access cached instance 
    const EventEmitter = require("events");
    const path = require('path');
    const {
        Asset,
        Inventory,
        RbAsset,
        TValue,
    } = require('../index');

    function rbtest() {
        var rb = app.locals.restBundles.filter(rb => rb.name==='test')[0];

        return rb;
    }

    var local = path.join(__dirname, '..', 'local');
    var inventoryPath = path.join(local, 'test-rb-asset');
    if (fs.existsSync(inventoryPath)) {
        var cmd = `rm -rf ${inventoryPath}`;
        child_process.execSync(cmd);
    }

    it("TESTTESTInitialize TEST suite", function(done) { // THIS TEST MUST BE FIRST
        var async = function*() {
            if (null == rbtest()) {
                yield app.locals.asyncOnReady.push(async);
            }
            winston.info("test suite initialized");
            var inventory = rbtest().inventory;
            if (inventory.inventoryPath !== inventoryPath) {
                inventory.inventoryPath = inventoryPath;
                yield inventory.close().then(r=>async.next(r)).catch(e=>done(e));
                yield inventory.open().then(r=>async.next(r)).catch(e=>done(e));
                var sampleFile = path.join(__dirname, 'sample-inventory.json');
                yield inventory.import(sampleFile).then(r=>async.next(r)).catch(e=>done(e));
            }
            done();
        }();
        async.next();
    });
    it("RbAsset(name,opts) creates an asset RestBundle", function(done){
        var async = function*() {
            try {
                // default ctor
                var rb = new RbAsset('test-ctor', {
                    inventoryPath,
                });
                yield rb.initialize().then(r=>async.next(r)).catch(e=>async.throw(e));
                should(rb).properties({
                    inventoryPath,
                });

                // import custom inventory
                var sampleInventory = path.join(__dirname, 'sample-inventory.json');
                var rb = new RbAsset('test-ctor', {
                    inventoryPath,
                });
                yield rb.initialize().then(r=>async.next(r)).catch(e=>done(e));
                yield rb.inventory.import(sampleInventory).then(r=>async.next(r)).catch(e=>done(e));
                should(rb.inventory).instanceOf(Inventory);
                var assets = [...rb.inventory.assets()];
                should(assets.length).above(2);
                should(assets[0]).properties({
                    type: 'plant',
                    id: 'A0001',
                    name: 'Tomato1',
                    guid: 'GUID001',
                });
                should(assets[1]).properties({
                    type: 'plant',
                    id: 'A0002',
                    name: 'Tomato2',
                    guid: 'GUID002',
                });

                // server.js ctor for 'test' service
                var inventory = rbtest().inventory;
                should(inventory.inventoryPath).equal(inventoryPath);
                if (!inventory.isOpen) {
                    yield inventory.open().then(r=>async.next()).catch(e=>done(e));
                }
                var assets = [...inventory.assets()];
                should(assets.length).above(2);

                done();
            } catch(e) {
                done(e);
            }
        }();
        async.next();
    });
    it("GET /identity returns RestBundle identity", function(done) {
        var async = function* () {
            try {
                var response = yield supertest(app).get("/test/identity").expect((res) => {
                    res.statusCode.should.equal(200);
                    should(res.body).properties({
                        name: 'test',
                        package: srcPkg.name,
                    });

                    // health is part of identity
                    should(res.body).properties({
                        package: 'oya-asset',
                        version: srcPkg.version,
                        name: 'test',
                    });
                }).end((e,r) => e ? async.throw(e) : async.next(r));
                done();
            } catch(err) {
                winston.error(err.stack);
                done(err);
            }
        }();
        async.next();
    });
    it("GET /inventory/guids returns asset guids", function(done) {
        (async function() { 
            try {
                var res = await supertest(app).get("/test/inventory/guids");
                res.statusCode.should.equal(200);
                var guids = [...rbtest().inventory.guids()];
                should.deepEqual(res.body, guids);

                done();
            } catch(err){done(err);} 
        })();
    });
    it("GET /asset/guid/:guid returns asset for guid", function(done) {
        (async function() {
            try {
                var inventory = rbtest().inventory;
                var a0001 = await inventory.assetOfGuid('GUID001');
                should(a0001).instanceOf(Asset);
                var url = `/test/asset/guid/GUID001`;

                var res = await supertest(app).get(url);
                res.statusCode.should.equal(200);
                should.deepEqual(res.body, JSON.parse(JSON.stringify(a0001)));
                
                done();
            } catch(err) {
                winston.error(err.stack);
                done(err);
            }
        })();
    });
    it("TESTTESTPUT /asset/guid/:guid upserts asset for guid", function(done) {
        (async function() {
            try {
                var inventory = rbtest().inventory;
                var a0001 = await inventory.assetOfGuid('GUID001');
                var a0001copy = new Asset(a0001);
                a0001copy.set('color', 'red');
                should(a0001.get('color')).equal(undefined);
                should(a0001copy.get('color')).equal('red');
                var url = `/test/asset/guid/GUID001`;

                var res = await supertest(app).put(url).send(a0001copy);
                res.statusCode.should.equal(200);

                // in-memory instance may not have changed
                should(a0001.get('color')).equal(undefined);

                // persistent asset is updated
                var a0001 = await inventory.assetOfGuid('GUID001');
                should.deepEqual(res.body, JSON.parse(JSON.stringify(a0001)));
                should(a0001.get('color')).equal('red');
                
                done();
            } catch(err) {
                winston.error(err.stack);
                done(err);
            }
        })();
    });
    it("GET /asset/guid/:guid returns asset for guid", function(done) {
        (async function() {
            try {
                var inventory = rbtest().inventory;
                var a0001 = await inventory.assetOfGuid('GUID001');
                should(a0001).instanceOf(Asset);
                var url = `/test/asset/guid/GUID001`;

                var res = await supertest(app).get(url);
                res.statusCode.should.equal(200);
                should.deepEqual(res.body, JSON.parse(JSON.stringify(a0001)));
                
                done();
            } catch(err) {
                winston.error(err.stack);
                done(err);
            }
        })();
    });
    it("GET /asset/snapshot/:id returns asset snapshot for id", function(done) {
        (async function() {
            try {
                var inventory = rbtest().inventory;
                var a0001 = await inventory.assetOfId('A0001');
                var url = `/test/asset/snapshot/A0001`;

                var res = await supertest(app).get(url);
                res.statusCode.should.equal(200);
                should.deepEqual(res.body, a0001.snapshot());
                
                done();
            } catch(err) {
                winston.error(err.stack);
                done(err);
            }
        })();
    });
    it("GET /inventory/snapshots/:date returns asset snapshot for date", function(done) {
        var async = function* () {
            try {
                // tomato1 is in bucket1; tomato2 is in bucket2
                var date = new Date();
                var url = `/test/inventory/snapshots/${date.toJSON()}`;
                var response = yield supertest(app).get(url).expect((res) => {
                    res.statusCode.should.equal(200);
                    should(res.body).properties({
                        date: date.toJSON(),
                    });
                    var assets = res.body.assets;
                    should(assets.length).above(0);
                    should(assets[0]).properties({
                        name: 'Tomato1',
                        id: 'A0001',
                        location: 'GUID003',
                    });
                    should(assets[1]).properties({
                        name: 'Tomato2',
                        id: 'A0002',
                        location: 'GUID004',
                    });
                }).end((e,r) => e ? async.throw(e) : async.next(r));

                // tomato1,tomato2 both in bucket1; 
                var date = new Date(2018,2,12);
                var url = `/test/inventory/snapshots/${date.toJSON()}`;
                var response = yield supertest(app).get(url).expect((res) => {
                    res.statusCode.should.equal(200);
                    should(res.body).properties({
                        date: date.toJSON(),
                    });
                    var assets = res.body.assets;
                    should(assets.length).above(0);
                    should(assets[0]).properties({
                        name: 'Tomato1',
                        id: 'A0001',
                        location: 'GUID003',
                        guid: 'GUID001',
                    });
                    should(assets[1]).properties({
                        name: 'Tomato2',
                        id: 'A0002',
                        location: 'GUID003',
                        guid: 'GUID002',
                    });
                    should(assets[2]).properties({
                        name: 'Bucket1',
                        id: 'A0003',
                        guid: 'GUID003',
                    });
                    should(assets[3]).properties({
                        name: 'Bucket2',
                        id: 'A0004',
                        guid: 'GUID004',
                    });
                }).end((e,r) => e ? async.throw(e) : async.next(r));

                done();
            } catch(err) {
                winston.error(err.stack);
                done(err);
            }
        }();
        async.next();
    });
    it("POST /inventory/snapshot creates an asset", function(done) {
        var async = function* () {
            try {
                var inventory = rbtest().inventory;
                var assetProps = {
                    type: Asset.T_RESERVOIR,
                    name: 'bucketA',
                    size: '5 gallon',
                };
                var initialAssetCount = inventory.assetCount();
                var t1 = new Date(2018, 1, 1);
                var t2 = new Date(2018, 1, 2);
                var url = `/test/asset/snapshot`;

                // insert new asset snapshot for time t2
                var command = {
                    upsert: assetProps,
                    t: t2,
                };
                var asset = null; // the new inventory asset
                var res = yield supertest(app).post(url).send(command).expect((res) => {
                }).end((e,r) => e ? async.throw(e) : async.next(r));
                should(res).not.equal(null);
                res.statusCode.should.equal(200);
                should(res.body).properties(assetProps);
                var oldasset = asset;
                asset = yield inventory.assetOfGuid(res.body.guid).then(r=>async.next(r)).catch(e=>done(e));
                should(res.body.guid).equal(asset.guid);
                should(res.body.id).equal(`${asset.guid.substr(0,7)}`);
                should.deepEqual(res.body, asset.snapshot()); // snapshot() of updated asset
                should(rbtest().inventory.assetCount()).equal(initialAssetCount+1);

                // size was set at creation, so it is a mutable non-temporal property
                should(asset.get('size', TValue.RETROACTIVE)).equal('5 gallon'); 
                should(asset.get('size', t2)).equal('5 gallon');
                should(asset.get('size', t1)).equal('5 gallon'); // size is non-temporal
                should.deepEqual(asset.describeProperty('size'), {
                    mutable: true,
                    name: 'size',
                    retroactive: false,
                    temporal:false,
                    own: true,
                });
                
                done();
            } catch(err) {
                winston.error(err.stack);
                done(err);
            }
        }();
        async.next();
    });
    it("POST /inventory/snapshot updates an asset with a new temporal property", function(done) {
        var async = function* () {
            try {
                var inventory = rbtest().inventory;
                var a1002 = yield inventory.saveAsset({
                    type: Asset.T_ENCLOSURE,
                    name: 'tent1002',
                    size: '4x4x6',
                    id: 'A1002',
                }).then(r=>async.next(r)).catch(e=>done(e));

                var initialAssetCount = inventory.assetCount();
                var t1 = new Date(2018, 1, 1);
                var t2 = new Date(2018, 1, 2);
                var url = `/test/asset/snapshot`;

                // update asset with new temporal property, 'color'
                var command = {
                    upsert: Object.assign(a1002.snapshot(), {
                        color: 'white',
                    }),
                    t: t2, // the date at which color is white
                };
                var res = yield supertest(app).post(url).send(command).expect((res) => {
                }).end((e,r) => e ? async.throw(e) : async.next(r));
                res.statusCode.should.equal(200);
                should(res.body).properties(command.upsert);
                var asset = yield rbtest().inventory.loadAsset(a1002.guid).then(r=>async.next(r))
                    .catch(e=>done(e));
                should.deepEqual(res.body, asset.snapshot()); // snapshot() of updated asset
                should(rbtest().inventory.assetCount()).equal(initialAssetCount);

                // color was set after creation, so it is a temporal property
                should(asset.get('color', t1)).equal(undefined); // color is temporal
                should(asset.get('color', t2)).equal('white'); // color is temporal
                should(asset.get('color')).equal('white');
                should.deepEqual(asset.describeProperty('color'), {
                    mutable: true,
                    name: 'color',
                    retroactive: false,
                    temporal:true,
                    own: false,
                });

                // size was set at creation, so it is a non-temporal property
                should(asset.get('size')).equal('4x4x6'); 
                should(asset.get('size', TValue.RETROACTIVE)).equal('4x4x6'); 
                should.deepEqual(asset.describeProperty('size'), {
                    mutable: true,
                    name: 'size',
                    retroactive: false,
                    temporal:false,
                    own: true,
                });

                done();
            } catch(err) {
                winston.error(err.stack);
                done(err);
            }
        }();
        async.next();
    });
    it("POST /inventory/snapshot updates an asset with a new, retroactive property", function(done) {
        var async = function* () {
            try {
                var inventory = rbtest().inventory;
                var a1003 = yield inventory.saveAsset({
                    type: Asset.T_ENCLOSURE,
                    name: 'tent1003',
                    id: 'A1003',
                }).then(r=>async.next(r)).catch(e=>done(e));
                var initialAssetCount = inventory.assetCount();

                // update asset with new temporal property, 'color'
                var command = {
                    upsert: Object.assign(a1003.snapshot(), {
                        color: 'white',
                    }),
                    t: TValue.RETROACTIVE,
                };
                var url = `/test/asset/snapshot`;
                var res = yield supertest(app).post(url).send(command).expect((res) => {
                }).end((e,r) => e ? async.throw(e) : async.next(r));
                res.statusCode.should.equal(200);
                should(res.body).properties(command.upsert);
                var asset = yield rbtest().inventory.loadAsset(a1003.guid).then(r=>async.next(r))
                    .catch(e=>done(e));
                should.deepEqual(res.body, asset.snapshot()); // snapshot() of updated asset
                should(asset.get('color', TValue.RETROACTIVE)).equal('white'); // color is retroactive
                should(asset.get('color')).equal('white');
                should(rbtest().inventory.assetCount()).equal(initialAssetCount);
                // color was set after creation, so it is a temporal property
                should.deepEqual(asset.describeProperty('color'), {
                    mutable: true,
                    name: 'color',
                    retroactive: true,
                    temporal:true,
                    own: false,
                });

                done();
            } catch(err) {
                winston.error(err.stack);
                done(err);
            }
        }();
        async.next();
    });
    it ("TESTTEST finalize test suite", function() {
        app.locals.rbServer.close();
        winston.info("end test suite");
        winston.level = level;
    });
})

