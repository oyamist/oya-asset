(typeof describe === 'function') && describe("RbAsset", function() {
    const should = require("should");
    const winston = require('winston');
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
    } = require('../index');
    function rbtest() {
        return app.locals.restBundles.filter(rb => rb.name==='test')[0];
    }

    it("TESTTESTInitialize TEST suite", function(done) { // THIS TEST MUST BE FIRST
        var async = function*() {
            if (null == rbtest()) {
                yield app.locals.asyncOnReady.push(async);
            }
            winston.info("test suite initialized");
            done();
        }();
        async.next();
    });
    it("RbAsset(name,opts) creates an asset RestBundle", function(done){
        var async = function*() {
            try {
                // default ctor
                var rb = new RbAsset('test-ctor');
                yield rb.initialize().then(r=>async.next(r)).catch(e=>async.throw(e));
                should(rb).properties({
                    inventoryPath: path.join(__dirname, '..', 'inventory.json'),
                });

                // load custom inventory
                var sampleInventory = path.join(__dirname, 'sample-inventory.json');
                var rb = new RbAsset('test-ctor', {
                    inventoryPath: sampleInventory,
                });
                yield rb.initialize().then(r=>async.next(r)).catch(e=>async.throw(e));
                should(rb.inventory).instanceOf(Inventory);
                var assets = rb.inventory.assets();
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
                should(rbtest().inventoryPath).equal(path.join('/tmp', 'inventory.json'));
                var assets = rbtest().inventory.assets();
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
    it("GET /asset/:id returns asset snapshot for id", function(done) {
        var async = function*() {
            try {
                var date = new Date();
                var url = `/test/asset/A0001`;
                var response = yield supertest(app).get(url).expect((res) => {
                    res.statusCode.should.equal(200);
                    var asset = res.body;
                    should.deepEqual(asset, {
                        type: 'plant',
                        cultivar: 'Chocolate Stripes',
                        id: 'A0001',
                        location: 'GUID003',
                        plant: 'tomato',
                        guid: 'GUID001',
                        name: 'Tomato1',
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
    it("GET /assets/:date returns asset snapshot for date", function(done) {
        var async = function* () {
            try {
                // tomato1 is in bucket1; tomato2 is in bucket2
                var date = new Date();
                var url = `/test/assets/${date.toJSON()}`;
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
                var url = `/test/assets/${date.toJSON()}`;
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
    it("TESTTESTPOST /asset upserts asset", function(done) {
        var async = function* () {
            try {
                var assetProps = {
                    type: Asset.T_RESERVOIR,
                    name: 'bucketA',
                    size: '5 gallon',
                };
                var initialAssetCount = rbtest().inventory.assets().length;
                var t1 = new Date(2018, 1, 1);
                var t2 = new Date(2018, 1, 2);

                // insert new asset snapshot for time t2
                var command = {
                    upsert: assetProps,
                    t: t2,
                };
                var asset = null; // the new inventory asset
                var response = yield supertest(app).post("/test/asset").send(command).expect((res) => {
                    res.statusCode.should.equal(200);
                    should(res.body).properties(assetProps);
                    var oldasset = asset;
                    asset = rbtest().inventory.assetOfGuid(res.body.guid);
                    should(res.body.guid).equal(asset.guid);
                    should(res.body.id).equal(`${asset.guid.substr(0,7)}`);
                    should.deepEqual(res.body, asset.snapshot()); // snapshot() of updated asset
                    should(asset.get('size', t2)).equal('5 gallon');
                    should(asset.get('size', t1)).equal(undefined);
                }).end((e,r) => e ? async.throw(e) : async.next(r));
                should(rbtest().inventory.assets().length).equal(initialAssetCount+1);
                
                // update new asset
                command.upsert = asset.snapshot();
                command.upsert.color = 'white';
                var response = yield supertest(app).post("/test/asset").send(command).expect((res) => {
                    res.statusCode.should.equal(200);
                    should(res.body).properties(command.upsert);
                    should.deepEqual(res.body, asset.snapshot()); // snapshot() of updated asset
                    should(asset.get('size', t2)).equal('5 gallon');
                    should(asset.get('size', t1)).equal(undefined);
                    should(asset.get('color', t1)).equal(undefined);
                    should(asset.get('color')).equal('white');
                }).end((e,r) => e ? async.throw(e) : async.next(r));
                should(rbtest().inventory.assets().length).equal(initialAssetCount+1);

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

