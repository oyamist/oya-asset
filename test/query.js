(typeof describe === 'function') && describe("Query", function() {
    const winston = require('winston');
    const should = require("should");
    const {
        Asset,
        Filter,
        Inventory,
        Plant,
        Query,
        TValue,

    } = require("../index");
    
    function testData() {
        var inventory = new Inventory();
        var t = [
            new Date(2018, 1, 1),
            new Date(2018, 1, 2),
            new Date(2018, 1, 3),
            new Date(2018, 1, 4),
            new Date(2018, 1, 5),
            new Date(2018, 1, 6),
            new Date(2018, 1, 7),
            new Date(2018, 1, 8),
            new Date(2018, 1, 9),
            new Date(2018, 1, 10),
        ];
        var tomato1 = new Plant({
            plant: Plant.P_TOMATO,
            id: "P0001",
            begin: t[0],
        });
        var tomato2 = new Plant({
            plant: Plant.P_TOMATO,
            id: "P0002",
            begin: t[0],
        });
        var bucket1 = new Asset({
            type: Asset.T_RESERVOIR,
            id: "B0001",
            begin: t[0],
        });
        var bucket2 = new Asset({
            type: Asset.T_RESERVOIR,
            id: "B0002",
            begin: t[0],
        });
        var tent1 = new Asset({
            type: Asset.T_TENT,
            id: "T0001",
            begin: t[0],
        });
        var tent2 = new Asset({
            type: Asset.T_TENT,
            id: "T0002",
            begin: t[0],
        });
        tomato1.set(TValue.T_LOCATION, bucket1.guid, t[0]);
        tomato2.set(TValue.T_LOCATION, bucket2.guid, t[0]);
        bucket1.set(TValue.T_LOCATION, tent1.guid, t[0]);
        bucket2.set(TValue.T_LOCATION, tent1.guid, t[0]);
        bucket2.set(TValue.T_LOCATION, tent2.guid, t[1]);
        inventory.addAsset(tomato1);
        inventory.addAsset(tomato2);
        inventory.addAsset(bucket1);
        inventory.addAsset(bucket2);
        inventory.addAsset(tent1);
        inventory.addAsset(tent2);
        var assets = [
            tomato1,
            tomato2,
            bucket1,
            bucket2,
            tent1,
            tent2,
        ].sort((a,b) => a.guid < b.guid ? -1 : (a.guid === b.guid ? 0 : 1));

        return {
            inventory,
            tomato1,
            tomato2,
            bucket1,
            bucket2,
            tent1,
            tent2,
            t,
            assets,
        };
    }

    it("testData() creates test dataset", function() {
        var td = testData();
        // initial state locations:
        //   tent1[ bucket1[tomato1], bucket2[tomato2] ]
        //   tent2[ ]]
        should(td.tomato1.get(TValue.T_LOCATION, td.t[0])).equal(td.bucket1.guid);
        should(td.tomato2.get(TValue.T_LOCATION, td.t[0])).equal(td.bucket2.guid);
        should(td.bucket1.get(TValue.T_LOCATION, td.t[0])).equal(td.tent1.guid);
        should(td.bucket2.get(TValue.T_LOCATION, td.t[0])).equal(td.tent1.guid);
        should(td.tent1.get(TValue.T_LOCATION, td.t[0])).equal(null);
        should(td.tent2.get(TValue.T_LOCATION, td.t[0])).equal(null);

        // current state locations:
        //   tent1[ bucket1[tomato1] ]
        //   tent2[ bucket2[tomato2] ]]
        should(td.tomato1.get(TValue.T_LOCATION)).equal(td.bucket1.guid);
        should(td.tomato2.get(TValue.T_LOCATION)).equal(td.bucket2.guid);
        should(td.bucket1.get(TValue.T_LOCATION)).equal(td.tent1.guid);
        should(td.bucket2.get(TValue.T_LOCATION)).equal(td.tent2.guid);
        should(td.tent1.get(TValue.T_LOCATION)).equal(null);
        should(td.tent2.get(TValue.T_LOCATION)).equal(null);

        // bucket2 moved to tent2 on t[1]
        should(td.bucket2.get(TValue.T_LOCATION, td.t[1])).equal(td.tent2.guid);  
    });
    it("Query(opts) create a query", function() {
        var td = testData();
        var query = new Query({
            inventory: td.inventory
        });
        should(query).properties({
            inventory: td.inventory
        });
    });
    it("neighbors(set,valueType,date) returns immediate neighbor set", function() {
        var td = testData();
        var query = new Query({
            inventory: td.inventory
        });

        // at t[0] all buckets are in tent1
        var buckets = [ td.bucket1, td.bucket2, ];
        var tents = query.neighbors(buckets, TValue.T_LOCATION, td.t[0]);
        var tentGuids = tents.map(tent=>tent.guid);
        var expected = [ td.tent1.guid, ]; // no duplicates
        should.deepEqual(tentGuids, expected);

        // at t[1] one bucket is in each tent
        var tents = query.neighbors(buckets, TValue.T_LOCATION, td.t[1]);
        var tentGuids = tents.map(tent=>tent.guid); // ordered by guid
        var expected = [ td.tent1.guid, td.tent2.guid, ].sort();
        should.deepEqual(tentGuids, expected);
    });
    it("assets(filter) returns assets matching filter", function() {
        var td = testData();
        var query = new Query({
            inventory: td.inventory
        });

        // By default, return all assets, ordered by guid, ascending
        var assets = td.inventory.assets();
        should.deepEqual(assets.map(a=>a.guid), td.assets.map(a=>a.guid));
        for (var i = 0; i< assets.length-1; i++) {
            should(assets[i].guid).below(assets[i+1].guid);
        }

        // currently, only bucket1 is in tent1 
        var tent1Filter = new Filter.TValueFilter(Filter.OP_EQ, {
            type: TValue.T_LOCATION,
            value: td.tent1.guid,
        });
        var assets = td.inventory.assets(tent1Filter);
        should.deepEqual(assets.map(a=>a.guid), [td.bucket1.guid]);

        // at t[0], both buckets were in tent1 
        var tent1Filter = new Filter.TValueFilter(Filter.OP_EQ, {
            type: TValue.T_LOCATION,
            value: td.tent1.guid,
            t: td.t[0],
        });
        var assets = td.inventory.assets(tent1Filter);
        should.deepEqual(assets.map(a=>a.guid), [
            td.bucket1.guid,
            td.bucket2.guid,
        ].sort());
    });

})
