(typeof describe === 'function') && describe("Plant", function() {
    const winston = require('winston');
    const should = require("should");
    const {
        AssetDefs,
        Event,
        Plant,
    } = require("../index");

    it("Plant(opts) creates a plant asset", function() {
        var plant = new Plant({
            id: 'A0002',
        });
        should(plant.id).equal('A0002');
        should(plant.type).equal('plant');
    });
    it("ageAt(targetType, startType) return elapsed days for given event", function() {
        var plant = new Plant();
        plant.addEvent(new Event({
            type: Event.T_BEGIN,
            desc: 'seed paper towel in plastic wrap',
            t: new Date(2018,1,1,7,30),
        }));
        plant.addEvent(new Event({
            type: Event.T_GERMINATING,
            desc: 'seed paper towel in plastic wrap',
            t: new Date(2018,1,5,8,30),
        }));
        plant.addEvent(new Event({
            type: Event.T_SPROUTED,
            desc: 'seed paper towel in plastic wrap',
            t: new Date(2018,1,10,9,30),
        }));
        should(plant.ageAt(Event.T_GERMINATING)).equal(4);
        should(plant.ageAt(Event.T_SPROUTED)).equal(9);
        should(plant.ageAt(Event.T_SPROUTED, Event.T_GERMINATING)).equal(5);
        should(plant.ageAt(Event.T_POLLINATED)).equal(null);
    });
    it("age() returns asset age in days", function() {
        var now = new Date();
        var yesterday = new Date(now.getTime() - 24*3600*1000);
        var lastWeek = new Date(now.getTime() - 7*24*3600*1000);
        var plant = new Plant();
        plant.addEvent({
            type: Event.T_BEGIN,
            t: lastWeek,
        });
        should(plant.age()).equal(7);

        // age is capped at end event
        plant.addEvent({
            type: Event.T_END,
            t: yesterday,
        });
        should(plant.age()).equal(6);
    });

})
