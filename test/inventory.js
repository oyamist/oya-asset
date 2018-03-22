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
})
