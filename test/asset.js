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
        asset.name = 'TomatoA';
        should.deepEqual(asset.name, `TomatoA`);
        should.deepEqual(asset.id, `A0001`);
        var assetCopy = new Asset(asset);
        should(assetCopy.guid).equal(asset.guid);
        should(assetCopy.id).equal(asset.id);
        should(assetCopy.type).equal(asset.type);

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
    it("Asset is erializable", function() {
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

})
