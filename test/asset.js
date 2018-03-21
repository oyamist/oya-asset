(typeof describe === 'function') && describe("Asset", function() {
    const winston = require('winston');
    const should = require("should");
    const {
        Asset,
        Plant,
        AssetDefs,
        TValue,
    } = require("../index");

    it("Asset(opts) creates an asset", function() {
        // Default ctor
        var asset = new Asset();
        should(asset.type).equal(Asset.T_PLANT); // Default type
        should(asset.id).equal(asset.guid.substr(0,7)); // Default id 
        should(asset.get(TValue.T_NAME)).equal(`plant_${asset.guid.substr(0,7)}`); // Default name
        should.deepEqual(asset.tvalues, [
            new TValue({
                t: new Date(0), // retroactive to 1/1/1970
                type: 'id',
                value: asset.guid.substr(0,7),
            }),
            new TValue({
                t: new Date(0), // retroactive to 1/1/1970
                type: 'name',
                value: `plant_${asset.guid.substr(0,7)}`,
            }),
        ]);

        // non-temporal properties are enumerable
        should.deepEqual(Object.keys(asset).sort(), [ 
            "begin",
            "end",
            "guid",
            "type",
        ].sort());

        // Asset name is generated if not provided
        should.deepEqual(asset.name, `plant_${asset.guid.substr(0,7)}`); 

        var asset = new Asset({
            id: 'A0001',
        });
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

        // the "begin" option sets non-temporal property
        var begin = new Date(2018,1,10);
        asset = new Asset({
            begin, // Date
        });
        should(asset.begin).equal(begin);
        asset = new Asset({
            begin: begin.toISOString(), // Date string
        });
        should(asset.begin.getTime()).equal(begin.getTime());
        asset = new Asset({
            begin: begin.toString(), // Date string
        });
        should(asset.begin.getTime()).equal(begin.getTime());

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
        var begin = new Date();
        var asset = new Asset({
            begin,
            type: Asset.T_PLANT,
            id: 'A0001',
            name: 'tomatoA',
        });
        var json = JSON.parse(JSON.stringify(asset));
        should.deepEqual(json, {
            begin: begin.toJSON(),
            end: null,
            type: 'plant',
            guid: asset.guid,
            tvalues:[{
                t: new Date(0).toJSON(),
                type: 'id',
                value: 'A0001',
            },{
                t: new Date(0).toJSON(),
                type: 'name',
                value: 'tomatoA',
            }]
        });
        var asset2 = new Asset(json);
        should.deepEqual(asset2, asset);

        var value = {
            size: 'large',
            color: 'blue',
            qty: 3,
        };
        asset.set(TValue.T_DIMENSIONS, value);
        should.deepEqual(asset.get(TValue.T_DIMENSIONS), value);
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

        var t1 = new Date(2018,1,1);
        var t2 = new Date(2018,1,2);
        asset.set(TValue.T_ACTIVATED, true, t1);
        should.equal(asset.get(TValue.T_ACTIVATED, t1), t1); // true is mapped to date
        asset.set(TValue.T_ACTIVATED, false, t2);
        should.equal(asset.get(TValue.T_ACTIVATED, t2), false);
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
        should(asset.location(t0)).equal(undefined);
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
            begin: t0,
            type: Asset.T_PUMP,
            id: "A0001",
            name: "Mister1",
            tvalues:[{
                type: 'color',
                value: 'red',
                t: t0,
            }]
        });
        should.deepEqual(asset.snapshot(), {
            begin: t0.toJSON(),
            end: null,
            type: Asset.T_PUMP,
            id: 'A0001',
            name: 'Mister1',
            guid: asset.guid,
            color: 'red',
        });

        var asset = new Plant({
            begin: t0,
            "type": "plant",
            "plant": "tomato",
            "cultivar": "Chocolate Stripes",
            "guid":"GUID001",
            "name": "Tomato1",
            "id": "A0001",
            "tvalues":[{
                "type": "location",
                "t": "2018-03-12T00:00:00Z",
                "value":"GUID003"
            }]
        });
        should(asset.get(Asset.T_PLANT)).equal('tomato');
        should.deepEqual(asset.snapshot(), {
            begin: t0.toJSON(),
            end: null,
            type: "plant",
            plant: "tomato",
            cultivar: "Chocolate Stripes",
            guid: "GUID001",
            name: "Tomato1",
            id: "A0001",
            location: "GUID003",
        });

        var asset = new Asset({
            begin: t0,
            type: Asset.T_PUMP,
            id: "A0001",
        });
        should.deepEqual(asset.snapshot(), {
            begin: t0.toJSON(),
            end: null,
            type: Asset.T_PUMP,
            id: 'A0001',
            name: 'pump_A0001',
            guid: asset.guid,
        });
        asset.set(TValue.T_LOCATION, 'SFO', t1);
        asset.set(TValue.T_LOCATION, 'LAX', t2);
        asset.set(TValue.T_LOCATION, 'PIT', t3);
        should(asset.snapshot()).properties({
            location: 'PIT',
        });
        should.deepEqual(asset.snapshot(new Date(t1.getTime()-1)), {
            begin: t0.toJSON(),
            end: null,
            type: Asset.T_PUMP,
            id: 'A0001',
            name: 'pump_A0001',
            guid: asset.guid,
            // no location
        });
        should(asset.snapshot(t1)).properties({
            location: 'SFO',
        });
        should(asset.snapshot(new Date(t2.getTime()-1))).properties( {
            location: 'SFO',
        });
        should(asset.snapshot(t2)).properties( {
            location: 'LAX',
        });
        should(asset.snapshot(t3)).properties( {
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
    it("updateSnapshot(snapBase,snapNew,date,text) updates properties", function(done) {
        var async = function*() {
            var t0 = new Date();
            var asset = new Asset();
            var assetOld = new Asset(asset);
            var snapBase = asset.snapshot();
            yield setTimeout(() => (async.next()), 1);
            var t1 = new Date();

            asset.updateSnapshot({
                id: 'A0001',
            }, t1, 'update1');
            should(asset.id).equal('A0001');
            should(asset.get('id', t0)).equal(assetOld.id);
            should.deepEqual(asset.tvalues.length, 3);
            should.deepEqual(asset.valueHistory('id'), [
                new TValue({
                    t:new Date(0),
                    type: 'id',
                    value: `${asset.guid.substr(0,7)}`,
                }), 
                new TValue({
                    t:t1,
                    text: 'update1',
                    type: 'id',
                    value: 'A0001',
                }),
            ]);

            // ignore redundant updates
            yield setTimeout(() => (async.next()), 1);
            var t2 = new Date();
            asset.updateSnapshot({
                id: 'A0001',
            }, t2, 'update1');
            should(asset.id).equal('A0001');
            should(asset.get('id', t0)).equal(assetOld.id);
            should.deepEqual(asset.tvalues.length, 3);

            should.throws(() => {
                asset.updateSnapshot({
                    type: 'a new type',
                });
            });
            should.throws(() => {
                asset.updateSnapshot({
                    guid: 'a new guid',
                });
            });

            done();
        }();
        async.next();
    });
    it("updateSnapshot(snapBase,snapNew,date,text) adds properties", function(done) {
        var async = function*() {
            var t0 = new Date();
            var asset = new Asset({
                begin: t0,
            });
            var assetOld = new Asset(asset);
            var snapBase = asset.snapshot();
            yield setTimeout(() => (async.next()), 1);
            var t1 = new Date();

            asset.updateSnapshot({
                size: 'Large',
            }, t1, 'update1');
            should(asset.get('size', t0)).equal(undefined);
            should(asset.get('size', t1)).equal('Large');
            should(asset.get('size')).equal('Large');
            should.deepEqual(asset.snapshot(), {
                begin: t0.toJSON(),
                end: null,
                guid: asset.guid,
                id: asset.id,
                name: asset.name,
                type: 'plant',
                size: 'Large',
            });
            done();
        }();
        async.next();
    });
    it("snapshots map true to assignment date", function(done) {
        var async = function*() {
            var asset = new Asset();
            var t0 = new Date(0);
            var t1 = new Date(2018, 1, 1);
            var tv1 = new TValue({
                type: TValue.T_ACTIVATED,
                value: true,
                t: t1,
            });
            var t2 = new Date(2018, 1, 2);
            var tv2 = new TValue({
                type: TValue.T_ACTIVATED,
                value: true,
                t: t2,
            });
            var t3 = new Date(2018, 1, 3);
            var tv3 = new TValue({
                type: TValue.T_ACTIVATED,
                value: false,
                t: t3,
            });
            var tfuture = new Date(Date.now() + 365*24*3600*1000);
            var tvfuture = new TValue({
                type: TValue.T_ACTIVATED,
                value: true,
                t: tfuture,
            });

            // before first assignment
            should(asset.get(TValue.T_ACTIVATED, t0)).equal(undefined);

            // assignment can be with explicit date
            asset.updateSnapshot({
                [TValue.T_ACTIVATED]: t1.toJSON(),
            });
            should.deepEqual(asset.valueHistory(TValue.T_ACTIVATED), [ tv1 ]);
            should.deepEqual(tv1.value, true); // store boolean value, not date
            should(asset.snapshot()).properties({
                activated: t1.toJSON(),
            });

            // map true to assignment date
            asset.updateSnapshot({
                [TValue.T_ACTIVATED]: true,
            }, t2);
            should.deepEqual(asset.valueHistory(TValue.T_ACTIVATED), [ tv1, tv2 ]);
            should.deepEqual(tv2.value, true); // store boolean value, not date
            should(asset.snapshot()).properties({ // snapshot returns current activated date
                activated: t2.toJSON(),
            });
            should(asset.snapshot(t1)).properties({ 
                activated: t1.toJSON(),
            });

            // future dates are supported without "plan vs. actual" distinction
            asset.updateSnapshot({
                [TValue.T_ACTIVATED]: tfuture.toJSON(),
            });
            should.deepEqual(asset.valueHistory(TValue.T_ACTIVATED), [ tv1, tv2, tvfuture ]);
            should(asset.snapshot()).properties({ // snapshot returns current activated date
                activated: t2.toJSON(),
            });
            should(asset.snapshot(tfuture)).properties({ // snapshot returns current activated date
                activated: tfuture.toJSON(),
            });

            // false is supported directly
            asset.updateSnapshot({
                [TValue.T_ACTIVATED]: false,
            }, t3);
            should.deepEqual(asset.valueHistory(TValue.T_ACTIVATED), [ tv1, tv2, tv3, tvfuture ]);
            should(asset.snapshot()).properties( { // snapshot returns current activated date
                activated: false,
            });
            should(asset.snapshot(tfuture)).properties({
                activated: tfuture.toJSON(),
            });

            done();
        }();
        async.next();
    });
    it("valueHistory(type) returns array of TValues of type", function() {
        var asset = new Asset();
        var t1 = new Date(2018,1,1);
        var t2 = new Date(2018,1,2);
        var t3 = new Date(2018,1,3);
        asset.set('color', 'blue', t3, 'C');
        asset.set('color', 'red', t1, 'A',);
        asset.set('color', 'green', t2, 'B');
        var history = asset.valueHistory('color');
        should.deepEqual(history.map(tv=>tv.value), ['red','green', 'blue']);
        should.deepEqual(history.map(tv=>tv.t), [t1,t2,t3]);
        should.deepEqual(history.map(tv=>tv.type), ['color','color','color']);
        should.deepEqual(history.map(tv=>tv.text), ['A','B','C']);
    });

})
