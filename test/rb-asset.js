(typeof describe === 'function') && describe("RbAsset", function() {
    const should = require("should");
    const srcPkg = require("../package.json");
    const supertest = require('supertest');
    const fs = require('fs');
    const APIMODEL_PATH = `api-model/${srcPkg.name}.test.json`;
    if (fs.existsSync(APIMODEL_PATH)) {
        fs.unlinkSync(APIMODEL_PATH);
    }
    const app = require("../scripts/server.js"); // access cached instance 
    const EventEmitter = require("events");
    const winston = require('winston');
    const path = require('path');
    const {
        RbAsset,
    } = require('../index');

    var level = winston.level;
    winston.level = 'info';

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
    it("GET /state returns push state", function(done) {
        var async = function* () {
            try {
                var response = yield supertest(app).get("/test/state").expect((res) => {
                    res.statusCode.should.equal(200);
                    var keys = Object.keys(res.body).sort();
                    should.deepEqual(keys, [
                        "Cool",
                        "Mist",
                        "Prime",
                        "active",
                        "api",
                        "countdown",
                        "countstart",
                        "cycle",
                        "cycleNumber",
                        "ecAmbient",
                        "ecCanopy",
                        "ecInternal",
                        "health",
                        "humidityAmbient",
                        "humidityCanopy",
                        "humidityInternal",
                        "lights",
                        "nextCycle",
                        "tempAmbient",
                        "tempCanopy",
                        "tempInternal",
                        "type",
                    ]);
                }).end((e,r) => e ? async.throw(e) : async.next(r));
                done();
            } catch (e) {
                done(e);
            }
        }();
        async.next();
    });
    it("TESTTESTGET /identity returns RestBundle identity", function(done) {
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
    it ("TESTTEST finalize test suite", function() {
        app.locals.rbServer.close();
        winston.info("end test suite");
        winston.level = level;
    });
})

