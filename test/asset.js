(typeof describe === 'function') && describe("Asset", function() {
    const winston = require('winston');
    const should = require("should");
    const {
        Asset,
        AssetDefs,
        Event,
    } = require("../index");

    it("Asset(opts) creates an asset", function() {
        var asset = new Asset();
        should(asset.type).equal(Asset.T_PLANT);
        should(asset.id).equal(undefined);
        should.deepEqual(asset.events, []);

        // Asset name is generated if not provided
        should.deepEqual(asset.name, `plant_${asset.guid.substr(0,6)}`); 
        asset.id = 'A0001';
        should.deepEqual(asset.name, `plant_A0001`); 
        asset.name = 'asdf';
        should.deepEqual(asset.name, `asdf`); 

        var asset2 = new Asset();
        should(asset.guid).not.equal(asset2.guid);

        asset = new Asset({
            name: 'TomatoA',
            id: 'A0001',
        });
        should.deepEqual(asset.name, `TomatoA`);
        should.deepEqual(asset.id, `A0001`);

        var assetCopy = new Asset(asset);
        should.deepEqual(assetCopy, asset);

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
    it("Asset is serializable", function() {
        var asset = new Asset({
            type: Asset.T_PLANT,
            id: 'A0001',
            name: 'tomatoA',
        });
        var json = JSON.stringify(asset);
        var asset2 = new Asset(JSON.parse(json));
        should.deepEqual(asset2, asset);

        asset.addEvent({
            type: Event.T_BEGIN,
            text: '1',
            value: {
                size: 'large',
                color: 'blue',
                qty: 3,
            },
        });
        asset.addEvent({
            type: Event.T_GERMINATING,
            text: '2',
        });
        var json = JSON.stringify(asset);
        var asset2 = new Asset(JSON.parse(json));
        should.deepEqual(asset2, asset);
        should(asset2.name).equal('tomatoA');
    });
    it("eventValue(eventType,date) returns event value for date", function() {
        var asset = new Asset();
        asset.addEvent({
            type: Event.T_POLLINATED,
            value: {
                size: 'small',
                qty: 2,
            },
        });
        asset.addEvent({
            type: Event.T_POLLINATED,
            value: {
                size: 'large',
            },
        });
        var asset = new Asset(JSON.parse(JSON.stringify(asset))); // is serializable
        should.deepEqual(asset.eventValue(Event.T_POLLINATED), {
            size: 'large',
        });
    });
    it("location(date) returns asset location for date", function() {
        var asset = new Asset();
        var t0 = new Date(2018,0,1);
        var t1 = new Date(2018,1,1);
        var t2 = new Date(2018,1,2);
        var t3 = new Date(2018,1,3);
        asset.addEvent({
            type: Event.T_LOCATION,
            t:t1,
            value: 'SFO',
        });
        asset.addEvent({
            type: Event.T_LOCATION,
            t:t2,
            value: 'LAX',
        });
        asset.addEvent({
            type: Event.T_LOCATION,
            t:t3,
            value: 'PIT',
        });
        var asset = new Asset(JSON.parse(JSON.stringify(asset))); // is serializable
        should(asset.location()).equal('PIT');
        should(asset.location(t0)).equal(null);
        should(asset.location(t1)).equal('SFO');
        should(asset.location(new Date(t2.getTime()-1))).equal('SFO');
        should(asset.location(t2)).equal('LAX');
        should(asset.location(new Date(t2.getTime()+1))).equal('LAX');
        should(asset.location(t3)).equal('PIT');
    });

})
