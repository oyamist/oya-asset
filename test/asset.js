(typeof describe === 'function') && describe("Asset", function() {
    const winston = require('winston');
    const should = require("should");
    const {
        Asset,
        Plant,
        AssetDefs,
        TValue,
    } = require("../index");
    function immutable(name) {
        return {
            name,
            mutable: false,
            temporal: false,
            retroactive: false,
            own: true,
        };
    }
    function retroactive(name) {
        return {
            name,
            mutable: true,
            temporal: true,
            retroactive: true,
            own: false,
        };
    }
    function mutable(name) {
        return {
            name,
            mutable: true,
            temporal: false,
            retroactive: false,
            own: true,
        };
    }
    function unused(name) {
        return {
            name,
            mutable: true,
            temporal: false,
            retroactive: false,
            own: false,
        };
    }
    function temporal(name) {
        return {
            name,
            mutable: true,
            temporal: true,
            retroactive: false,
            own: false,
        };
    }

    it("Asset(opts) creates an asset", function() {
        // Default ctor
        var asset = new Asset();
        should(asset.type).equal(Asset.T_ASSET); // Default type
        should(asset.id).equal(asset.guid.substr(0,7)); // Default id 
        should(asset.get(TValue.T_NAME)).equal(`asset_${asset.guid.substr(0,7)}`); // Default name
        should.deepEqual(asset.tvalues, [
            new TValue({
                t: TValue.RETROACTIVE,
                tag: 'id',
                value: asset.guid.substr(0,7),
            }),
            new TValue({
                t: TValue.RETROACTIVE,
                tag: 'name',
                value: `asset_${asset.guid.substr(0,7)}`,
            }),
        ]);

        // non-temporal properties are enumerable
        should.deepEqual(Object.keys(asset).sort(), [ 
            "begin",
            "end",
            "guid",
            "type",
            "tvalues",
        ].sort());

        // Asset name is generated if not provided
        should.deepEqual(asset.name, `asset_${asset.guid.substr(0,7)}`); 

        var asset = new Asset({
            id: 'A0001',
        });
        should.deepEqual(asset.name, `asset_A0001`); 
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
        should(asset.get(TValue.T_ID, TValue.RETROACTIVE)).equal('A0001'); // id is retroactive

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
            "address",
            "asset",
            "computer",
            "enclosure",
            "light",
            "nutrient",
            "plant",
            "pump",
            "reservoir",
            "sensor",
            "vendor",

        ].sort());
    });
    it("Asset is serializable", function() {
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
                t: TValue.RETROACTIVE.toJSON(),
                tag: 'id',
                value: 'A0001',
            },{
                t: TValue.RETROACTIVE.toJSON(),
                tag: 'name',
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
        asset.setTValue(TValue.T_DIMENSIONS, value);
        should.deepEqual(asset.get(TValue.T_DIMENSIONS), value);
        asset.setTValue(TValue.T_DIMENSIONS);
        var json = JSON.stringify(asset);
        var asset2 = new Asset(JSON.parse(json));
        should.deepEqual(asset2, asset);
        should(asset2.name).equal('tomatoA');
    });
    it("set(valueTag, value, date) sets asset temporal value", function() {
        var asset = new Asset();

        // set(valueTag, value)
        asset.setTValue(TValue.T_LOCATION, 'SFO');
        should(asset.get(TValue.T_LOCATION)).equal('SFO');
        asset.setTValue(TValue.T_LOCATION, 'LAX');
        should(asset.get(TValue.T_LOCATION)).equal('LAX');

        // set(tvalue)
        asset.setTValue(new TValue({
            tag: TValue.T_LOCATION, 
            value: 'ATL',
        }));
        should(asset.get(TValue.T_LOCATION)).equal('ATL');
        asset.setTValue({
            tag: TValue.T_LOCATION, 
            value: 'PIT',
        });
        should(asset.get(TValue.T_LOCATION)).equal('PIT');

        // set prior value
        var t1 = new Date(2018,1,10);
        asset.setTValue({
            tag: TValue.T_LOCATION, 
            value: 'NYC',
            t: t1,
        });
        should(asset.get(TValue.T_LOCATION,t1)).equal('NYC');
        should(asset.get(TValue.T_LOCATION)).equal('PIT');
    });
    it("get(valueTag,date) returns temporal value for date", function() {
        var asset = new Asset();
        asset.setTValue(TValue.T_DIMENSIONS, {
            size: 'small',
            qty: 2,
        });
        asset.setTValue(TValue.T_DIMENSIONS, { 
            size: 'large', 
        });
        var asset = new Asset(JSON.parse(JSON.stringify(asset))); // is serializable
        should.deepEqual(asset.get(TValue.T_DIMENSIONS), {
            size: 'large',
        });

        var t1 = new Date(2018,1,1);
        var t2 = new Date(2018,1,2);
        asset.setTValue(TValue.T_ACTIVATED, TValue.V_EVENT, t1);
        should.equal(asset.get(TValue.T_ACTIVATED, t1), t1); // TValue.V_EVENT is mapped to date
        asset.setTValue(TValue.T_ACTIVATED, false, t2);
        should.equal(asset.get(TValue.T_ACTIVATED, t2), false);
    });
    it("get(valueTag,date) also returns non-temporal property value ", function() {
        var asset = new Asset();
        var t1 = new Date(2018,1,2);
        should(asset.get('guid')).equal(asset.guid);
        should(asset.get('guid', t1)).equal(asset.guid);
    });
    it("set(valueTag, value, date) also sets non-temporal properties", function() {
        var asset = new Asset();
        var t1 = new Date(2018,2,1);
        should(asset.begin.toJSON()).not.equal(t1.toJSON());
        asset.setTValue("begin", t1);
        should(asset.begin.toJSON()).equal(t1.toJSON());

        // immutable 
        should.throws(() => {
            asset.setTValue("guid", "asdf");
        });
        should.throws(() => {
            asset.setTValue("type", "asdf");
        });
    });
    it("location(date) returns asset location for date", function() {
        var asset = new Asset();
        var t0 = new Date(2018,0,1);
        var t1 = new Date(2018,1,1);
        var t2 = new Date(2018,1,2);
        var t3 = new Date(2018,1,3);
        asset.setTValue(TValue.T_LOCATION, 'SFO', t1);
        asset.setTValue(TValue.T_LOCATION, 'LAX', t2);
        asset.setTValue(TValue.T_LOCATION, 'PIT', t3);
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
                tag: 'color',
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
                "tag": "location",
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
        asset.setTValue(TValue.T_LOCATION, 'SFO', t1);
        asset.setTValue(TValue.T_LOCATION, 'LAX', t2);
        asset.setTValue(TValue.T_LOCATION, 'PIT', t3);
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
            var t0 = TValue.RETROACTIVE;
            var t1 = new Date();
            should(asset.id).equal('A0001');
            should(asset.get(TValue.T_ID, t0)).equal('A0001'); // retroactive
            yield setTimeout(()=>async.next(), TValue.TIME_RESOLUTION_MS);
            var t2 = new Date();
            should(t1.getTime()).below(t2.getTime());

            // sometimes asset tags get lost and need to be changed
            asset.id = 'A0002';
            should(asset.id).equal('A0002');

            // but we still remember the legacy id
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
            yield setTimeout(() => (async.next()), 10);
            var t1 = new Date();

            asset.updateSnapshot({
                id: 'A0001',
            }, t1, 'update1');
            should(asset.id).equal('A0001');
            should(asset.get('id', t0)).equal(assetOld.id);
            should.deepEqual(asset.tvalues.length, 3);
            should.deepEqual(asset.valueHistory('id'), [
                new TValue({
                    t:TValue.RETROACTIVE,
                    tag: 'id',
                    value: `${asset.guid.substr(0,7)}`,
                }), 
                new TValue({
                    t:t1,
                    text: 'update1',
                    tag: 'id',
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
            yield setTimeout(() => (async.next()), 10);
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
                type: 'asset',
                size: 'Large',
            });
            done();
        }();
        async.next();
    });
    it("snapshots map TValue.V_EVENT to assignment date", function(done) {
        var async = function*() {
            var asset = new Asset();
            var t0 = TValue.RETROACTIVE;
            var t1 = new Date(2018, 1, 1);
            var tv1 = new TValue({
                tag: TValue.T_ACTIVATED,
                value: TValue.V_EVENT,
                t: t1,
            });
            var t2 = new Date(2018, 1, 2);
            var tv2 = new TValue({
                tag: TValue.T_ACTIVATED,
                value: TValue.V_EVENT,
                t: t2,
            });
            var t3 = new Date(2018, 1, 3);
            var tv3 = new TValue({
                tag: TValue.T_ACTIVATED,
                value: false,
                t: t3,
            });
            var tfuture = new Date(Date.now() + 365*24*3600*1000);
            var tvfuture = new TValue({
                tag: TValue.T_ACTIVATED,
                value: TValue.V_EVENT,
                t: tfuture,
            });

            // before first assignment
            should(asset.get(TValue.T_ACTIVATED, t0)).equal(undefined);

            // assignment can be with explicit date
            asset.updateSnapshot({
                [TValue.T_ACTIVATED]: t1.toJSON(),
            });
            should.deepEqual(asset.valueHistory(TValue.T_ACTIVATED), [ tv1 ]);
            should.deepEqual(tv1.value, TValue.V_EVENT); // store event marker value
            should(asset.snapshot()).properties({
                activated: t1.toJSON(),
            });

            // map TValue.V_EVENT to assignment date
            asset.updateSnapshot({
                [TValue.T_ACTIVATED]: TValue.V_EVENT,
            }, t2);
            should.deepEqual(asset.valueHistory(TValue.T_ACTIVATED), [ tv1, tv2 ]);
            should.deepEqual(tv2.value, TValue.V_EVENT); // event marker value
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
    it("TESTTESTkeyDisplayValue(key, asset, assetMap, locale)", function() {
        var asset = new Asset();
        var t1 = new Date(2018,1,1);
        var t2 = new Date(2018,1,2);
        var t3 = new Date(2018,1,3);
        var t4 = new Date(2018,1,10);
        assetMap = {
            [asset.guid]: asset,
        };
        asset.color = 'red';
        should.deepEqual(Asset.keyDisplayValue('color' , asset, assetMap), 'red');
        asset.height = 1.43;
        should.deepEqual(Asset.keyDisplayValue('height' , asset, assetMap), 1.43);
        asset.graduated = t1;
        should.deepEqual(Asset.keyDisplayValue('graduated' , asset, assetMap), t1);
        asset.begin = t1;
        asset.end = t4;
        asset.married = t3.toISOString();
        should.deepEqual(Asset.keyDisplayValue('married' , asset, assetMap), 
            'Sat, Feb 3 (-7 days @ 2 days) \u2666 12:00 AM');
    });
    it("valueHistory(tag) returns array of TValues of tag", function() {
        var asset = new Asset();
        var t1 = new Date(2018,1,1);
        var t2 = new Date(2018,1,2);
        var t3 = new Date(2018,1,3);
        asset.setTValue('color', 'blue', t3, 'C');
        asset.setTValue('color', 'red', t1, 'A',);
        asset.setTValue('color', 'green', t2, 'B');
        var history = asset.valueHistory('color');
        should.deepEqual(history.map(tv=>tv.value), ['red','green', 'blue']);
        should.deepEqual(history.map(tv=>tv.t), [t1,t2,t3]);
        should.deepEqual(history.map(tv=>tv.tag), ['color','color','color']);
        should.deepEqual(history.map(tv=>tv.text), ['A','B','C']);
    });
    it("describeProperty(name) returns property description", function() {
        var asset = new Asset({
            size: 'large',
        });
        should.deepEqual(asset.describeProperty('guid'), immutable('guid'));
        should.deepEqual(asset.describeProperty('type'), immutable('type'));
        should.deepEqual(asset.describeProperty('id'), retroactive('id'));
        should.deepEqual(asset.describeProperty('size'), mutable('size'));
        should.deepEqual(asset.describeProperty('asdf'), unused('asdf'));
        should.deepEqual(asset.describeProperty('location'), unused('location'));
        should.deepEqual(asset.describeProperty('color'), unused('color'));

        // create a temporal property
        asset.setTValue("location", "SFO");
        should.deepEqual(asset.describeProperty('location'), temporal('location'));

        // create retroactive property
        asset.setTValue("color", 'red', TValue.RETROACTIVE);
        should.deepEqual(asset.describeProperty('color'), retroactive('color'));

        // serialized asset has same property definitions
        var asset = new Asset(JSON.parse(JSON.stringify(asset)));
        should.deepEqual(asset.describeProperty('guid'), immutable('guid'));
        should.deepEqual(asset.describeProperty('type'), immutable('type'));
        should.deepEqual(asset.describeProperty('id'), retroactive('id'));
        should.deepEqual(asset.describeProperty('size'), mutable('size'));
        should.deepEqual(asset.describeProperty('asdf'), unused('asdf'));
        should.deepEqual(asset.describeProperty('location'), temporal('location'));
        should.deepEqual(asset.describeProperty('color'), retroactive('color'));
    });
    it("merge(asset1,asset2) two versions of same asset", function() {
        var t = [
            new Date(2018,11,1),
            new Date(2018,11,2),
            new Date(2018,11,3),
        ];
        var asset1 = new Asset({
            id: 'asset1',
            color: 'red1',
        });
        asset1.setTValue('inspected', TValue.V_EVENT, t[0]);
        asset1.setTValue('inspected', TValue.V_EVENT, t[1]);
        var asset2 = new Asset(Object.assign({}, asset1, {
            id: 'asset2',
            color: 'red2',
        }));
        asset2.setTValue('inspected', TValue.V_EVENT, t[2]);

        var expected = new Asset(JSON.parse(JSON.stringify(asset2)));
        var etv = expected.tvalues.sort((a,b) => TValue.compare_t_tag(a,b));
        for (var i = 1; i < etv.length; i++) {
            should(TValue.compare_t_tag(etv[i-1],etv[i])).below(1);
        }
        var merged = Asset.merge(asset1,asset2);
        merged.tvalues.sort(TValue.compare_t_tag);
        should.deepEqual(merged.tvalues.map(tv=>tv.toString()), 
            expected.tvalues.map(tv=>tv.toString()));
        should.deepEqual(merged, expected);
    });

})
