(typeof describe === 'function') && describe("Plant", function() {
    const winston = require('winston');
    const should = require("should");
    const {
        AssetDefs,
        TValue,
        Plant,
    } = require("../index");

    it("Plant(opts) creates a plant asset", function() {
        var plant = new Plant({
            id: 'A0002',
            plant: 'tomato',
            cultivar: 'Chocolate Stripes',
        });
        should(plant.id).equal('A0002');
        should(plant.type).equal('plant');
        should(plant.plant).equal('tomato');
        should(plant.cultivar).equal('Chocolate Stripes');
        should(plant.name).equal(`Chocolate Stripes tomato_A0002`);

        var plant = new Plant({
            cultivar: 'Cherokee Purple',
        });
        var idExpected = plant.guid.substr(0,7);
        should(plant.id).equal(idExpected);
        should(plant.type).equal('plant');
        should(plant.plant).equal(null);
        should(plant.cultivar).equal('Cherokee Purple');
        should(plant.name).equal(`Cherokee Purple plant_${idExpected}`);

        var plant = new Plant({
            plant: 'corn',
        });
        var idExpected = plant.guid.substr(0,7);
        should(plant.id).equal(idExpected);
        should(plant.type).equal('plant');
        should(plant.plant).equal('corn');
        should(plant.cultivar).equal(null);
        should(plant.name).equal(`corn_${idExpected}`);

        var plant = new Plant({
            plant: 'corn',
            cultivar: '',
        });
        var idExpected = plant.guid.substr(0,7);
        should(plant.id).equal(idExpected);
        should(plant.type).equal('plant');
        should(plant.plant).equal('corn');
        should(plant.cultivar).equal('');
        should(plant.name).equal(`corn_${idExpected}`);
    });
    it("ageAt(targetType, startType) return elapsed days for given event", function() {
        var plant = new Plant();
        plant.set(TValue.T_BEGIN, true, new Date(2018,1,1,7,30));
        plant.set(Plant.T_GERMINATING, true, new Date(2018,1,5,8,30));
        plant.set(Plant.T_SPROUTED, true, new Date(2018,1,10,9,30));
        should(plant.ageAt(Plant.T_GERMINATING)).equal(4);
        should(plant.ageAt(Plant.T_SPROUTED)).equal(9);
        should(plant.ageAt(Plant.T_SPROUTED, Plant.T_GERMINATING)).equal(5);
        should(plant.ageAt(Plant.T_POLLINATED)).equal(null);
    });
    it("age() returns asset age in days", function() {
        var now = new Date();
        var yesterday = new Date(now.getTime() - 24*3600*1000);
        var lastWeek = new Date(now.getTime() - 7*24*3600*1000);
        var plant = new Plant();
        plant.set(TValue.T_BEGIN, true, lastWeek);
        should(plant.age()).equal(7);

        // age is capped at end event
        plant.set(TValue.T_END, true, yesterday);
        should(plant.age()).equal(6);
    });

})
