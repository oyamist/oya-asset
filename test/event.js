(typeof describe === 'function') && describe("Event", function() {
    const winston = require('winston');
    const should = require("should");
    const {
        Event,
    } = require("../index");

    it("Event(opts) creates an asset event", function() {
        var evt = new Event();
        should(evt.t).instanceOf(Date);
        should(evt.type).equal('begin');

        var date = new Date(2018, 3, 11);
        var evt2 = new Event({
            t: date,
            type: Event.T_GERMINATING,
            text: 'asdf',
            value: 'purple',
        });
        should.deepEqual(evt2.t, date);
        should(evt2.type).equal('germinating');
        should(evt2.text).equal('asdf');
        should(evt2.value).equal('purple');
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
    it("Events are serializable", function() {
        var date = new Date(2018,2,10,7,30,10);
        var event1 = new Event({
            type: Event.T_POLLINATED,
            text: 'asdf',
            t: date,
            value: 'purple',
        });
        var json = JSON.stringify(event1);
        var event2 = new Event(JSON.parse(json));
        should.deepEqual(event2, event1);
    });

})
