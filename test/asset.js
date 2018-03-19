(typeof describe === 'function') && describe("Asset", function() {
    const winston = require('winston');
    const should = require("should");
    const {
        Asset,
        AssetDefs,
        TValue,
    } = require("../index");

    it("TESTTESTAsset(opts) creates an asset", function() {
        // Default ctor
        var asset = new Asset();
        should(asset.type).equal(Asset.T_PLANT);
        should(asset.id).equal(asset.guid.substr(0,7)); // Default id is short guid
        should.deepEqual(asset.tvalues, [new TValue({
            t: new Date(0), // id's are retroactive to 1/1/1970
            type: 'id',
            value: asset.guid.substr(0,7),
        })]);

        // Asset name is generated if not provided
        should.deepEqual(asset.name, `plant_${asset.guid.substr(0,7)}`); 
        asset.id = 'A0001';
        should.deepEqual(asset.name, `plant_A0001`); 
        asset.name = 'asdf';
        should.deepEqual(asset.name, `asdf`); 

        var asset2 = new Asset();
        should(asset.guid).not.equal(asset2.guid);

        // ctor options can set asset properties
        asset = new Asset({
            name: 'TomatoA',
            id: 'A0001', // if provided, id overrides guid prefix
            begin,
        });
        should.deepEqual(asset.name, `TomatoA`);
        should.deepEqual(asset.id, `A0001`); // current id
        should(asset.get(TValue.T_ID, new Date(0))).equal('A0001'); // id is retroactive

        // the "begin" option sets temporal property TValue.T_BEGINVALUE
        var begin = new Date(2018,1,10);
        var tvExpected = new TValue({
            type: TValue.T_BEGIN,
            t: begin,
            value: true,
        });
        asset = new Asset({
            begin, // Date
        });
        var tvBegin = asset.getTValue(TValue.T_BEGIN);
        should.deepEqual(tvBegin, tvExpected);
        asset = new Asset({
            begin: begin.toISOString(), // Date string
        });
        var tvBegin = asset.getTValue(TValue.T_BEGIN);
        should.deepEqual(tvBegin, tvExpected);
        asset = new Asset({
            begin: begin.toString(), // Date string
        });
        var tvBegin = asset.getTValue(TValue.T_BEGIN);
        should.deepEqual(tvBegin, tvExpected);

        // copy constructor
        var assetCopy = new Asset(asset);
        should.deepEqual(assetCopy, asset);

        // error handling
        should.throws(() => {
            new Asset({
                type: 'bad type',
            });
        });
        should.throws(() => {
            new Asset({
                type: undefined,
            });
        });
    });
    it("assetTypes returns asset types", function() {
        should.deepEqual(Asset.assetTypes(), [
            "actuator",
            "light",
            "mcu",
            "plant",
            "pump",
            "reservoir",
            "sensor",
            "tent",
        ]);
    });
    it("TESTTESTAsset is serializable", function() {
        var asset = new Asset({
            type: Asset.T_PLANT,
            id: 'A0001',
            name: 'tomatoA',
        });
        var json = JSON.parse(JSON.stringify(asset));
        should.deepEqual(json, {
            type: 'plant',
            name: 'tomatoA',
            guid: asset.guid,
            tvalues:[{
                t: new Date(0).toJSON(),
                type: 'id',
                value: 'A0001',
            }]
        });
        var asset2 = new Asset(json);
        should.deepEqual(asset2, asset);

        asset.set(TValue.T_BEGIN, {
            size: 'large',
            color: 'blue',
            qty: 3,
        });
        asset.set(TValue.T_DIMENSIONS);
        var json = JSON.stringify(asset);
        var asset2 = new Asset(JSON.parse(json));
        should.deepEqual(asset2, asset);
        should(asset2.name).equal('tomatoA');
    });
    it("set(valueType, value, date) sets asset temporal value", function() {
        var asset = new Asset();

        // set(valueType, value)
        asset.set(TValue.T_LOCATION, 'SFO');
        should(asset.get(TValue.T_LOCATION)).equal('SFO');
        asset.set(TValue.T_LOCATION, 'LAX');
        should(asset.get(TValue.T_LOCATION)).equal('LAX');

        // set(tvalue)
        asset.set(new TValue({
            type: TValue.T_LOCATION, 
            value: 'ATL',
        }));
        should(asset.get(TValue.T_LOCATION)).equal('ATL');
        asset.set({
            type: TValue.T_LOCATION, 
            value: 'PIT',
        });
        should(asset.get(TValue.T_LOCATION)).equal('PIT');

        // set prior value
        var t1 = new Date(2018,1,10);
        asset.set({
            type: TValue.T_LOCATION, 
            value: 'NYC',
            t: t1,
        });
        should(asset.get(TValue.T_LOCATION,t1)).equal('NYC');
        should(asset.get(TValue.T_LOCATION)).equal('PIT');
    });
    it("get(valueType,date) returns temporal value for date", function() {
        var asset = new Asset();
        asset.set(TValue.T_DIMENSIONS, {
            size: 'small',
            qty: 2,
        });
        asset.set(TValue.T_DIMENSIONS, { 
            size: 'large', 
        });
        var asset = new Asset(JSON.parse(JSON.stringify(asset))); // is serializable
        should.deepEqual(asset.get(TValue.T_DIMENSIONS), {
            size: 'large',
        });
    });
    it("location(date) returns asset location for date", function() {
        var asset = new Asset();
        var t0 = new Date(2018,0,1);
        var t1 = new Date(2018,1,1);
        var t2 = new Date(2018,1,2);
        var t3 = new Date(2018,1,3);
        asset.set(TValue.T_LOCATION, 'SFO', t1);
        asset.set(TValue.T_LOCATION, 'LAX', t2);
        asset.set(TValue.T_LOCATION, 'PIT', t3);
        var asset = new Asset(JSON.parse(JSON.stringify(asset))); // is serializable
        should(asset.location()).equal('PIT');
        should(asset.location(t0)).equal(null);
        should(asset.location(t1)).equal('SFO');
        should(asset.location(new Date(t2.getTime()-1))).equal('SFO');
        should(asset.location(t2)).equal('LAX');
        should(asset.location(new Date(t2.getTime()+1))).equal('LAX');
        should(asset.location(t3)).equal('PIT');
    });
    it("snapshot(date) returns asset properties for date", function() {
        var t0 = new Date(2018,0,1);
        var t1 = new Date(2018,1,1);
        var t2 = new Date(2018,1,2);
        var t3 = new Date(2018,1,3);
        var asset = new Asset({
            type: Asset.T_PUMP,
            id: "A0001",
        });
        should.deepEqual(asset.snapshot(), {
            type: Asset.T_PUMP,
            id: 'A0001',
            name: 'pump_A0001',
            guid: asset.guid,
        });
        asset.set(TValue.T_LOCATION, 'SFO', t1);
        asset.set(TValue.T_LOCATION, 'LAX', t2);
        asset.set(TValue.T_LOCATION, 'PIT', t3);
        should.deepEqual(asset.snapshot(), {
            type: Asset.T_PUMP,
            id: 'A0001',
            name: 'pump_A0001',
            guid: asset.guid,
            location: 'PIT',
        });
        should.deepEqual(asset.snapshot(new Date(t1.getTime()-1)), {
            type: Asset.T_PUMP,
            id: 'A0001',
            name: 'pump_A0001',
            guid: asset.guid,
            // no location
        });
        should.deepEqual(asset.snapshot(t1), {
            type: Asset.T_PUMP,
            id: 'A0001',
            name: 'pump_A0001',
            guid: asset.guid,
            location: 'SFO',
        });
        should.deepEqual(asset.snapshot(new Date(t2.getTime()-1)), {
            type: Asset.T_PUMP,
            id: 'A0001',
            name: 'pump_A0001',
            guid: asset.guid,
            location: 'SFO',
        });
        should.deepEqual(asset.snapshot(t2), {
            type: Asset.T_PUMP,
            id: 'A0001',
            name: 'pump_A0001',
            guid: asset.guid,
            location: 'LAX',
        });
        should.deepEqual(asset.snapshot(t3), {
            type: Asset.T_PUMP,
            id: 'A0001',
            name: 'pump_A0001',
            guid: asset.guid,
            location: 'PIT',
        });
    });
    it("id is a temporal value retroactive to 1/1/1970", function() {
        var async = function *() {
            var asset = new Asset({
                type: Asset.T_PLANT,
                id: 'A0001',
            });
            var t0 = new Date(0);
            var t1 = new Date();
            should(asset.id).equal('A0001');
            should(asset.get(TValue.T_ID, t0)).equal('A0001'); // retroactive
            yield setTimeout(()=>async.next(), TValue.TIME_RESOLUTION_MS);
            var t2 = new Date();
            should(t1.getTime()).below(t2.getTime());

            // sometimes asset tags get lost and need to be changed
            asset.id = 'A0002';
            should(asset.id).equal('A0002');

            // but we still remember the legacy tag
            should(asset.get(TValue.T_ID, t1)).equal('A0001');
        }();
        async.next();
    });

})
