(typeof describe === 'function') && describe("Event", function() {
    const winston = require('winston');
    const should = require("should");
    const {
        AssetDefs,
        Event,
    } = require("../index");

    it("Event(opts) creates an asset event", function() {
        var evt = new Event();
        should(evt.t).instanceOf(Date);
        should(evt.type).equal('begin');

        var date = new Date(2018, 3, 11);
        var evt2 = new Event({
            t: date,
            type: Event.E_GERMINATING,
        });
        should.deepEqual(evt2.t, date);
        should(evt2.type).equal('germinating');
    });
    it("eventTypes returns event types", function() {
        should.deepEqual(Event.eventTypes(), [
            "begin",
            'germinating',
            'sprouted',
            'budding',
            'flowering',
            'pollinated',
            'fruiting',
            'ripening',
            'harvested',
            "end",
        ]);
    });

})
