(typeof describe === 'function') && describe("Inventory", function() {
    const winston = require('winston');
    const should = require("should");
    const {
        Asset,
        TValue,
        Inventory,
        Plant,
    } = require("../index");

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
            type: Asset.T_TENT,
        });
        iv.addAsset(plant1);
        iv.addAsset(plant2);
        iv.addAsset(tent1);
        should.deepEqual(iv.assetOfGuid(plant1.guid), plant1);
        should.deepEqual(iv.assetOfGuid(plant2.guid), plant2);
        should.deepEqual(iv.assetOfGuid(tent1.guid), tent1);

        var json = JSON.stringify(iv);
        var iv2 = new Inventory(JSON.parse(json));
        should.deepEqual(iv2, iv);
        should.deepEqual(iv2.assetOfGuid(plant1.guid), plant1);
        should.deepEqual(iv2.assetOfGuid(plant2.guid), plant2);
        should.deepEqual(iv2.assetOfGuid(tent1.guid), tent1);
        should(iv2.assetOfGuid(tent1.guid).name).equal('tent1');
        
    });
    it("Inventory is serializable", function() {
        var iv = new Inventory();
    });

})
