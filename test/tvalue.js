(typeof describe === 'function') && describe("TValue", function() {
    const winston = require('winston');
    const should = require("should");
    const {
        TValue,
        Plant,
    } = require("../index");

    it("TValue(opts) creates an temporal value", function() {
        var evt = new TValue();
        should(evt.t).instanceOf(Date);
        should(evt.tag).equal(TValue.T_NONE);

        var date = new Date(2018, 3, 11);
        var evt2 = new TValue({
            t: date,
            tag: Plant.T_GERMINATING,
            text: 'asdf',
            value: 'purple',
        });
        should.deepEqual(evt2.t, date);
        should(evt2.tag).equal('germinating');
        should(evt2.text).equal('asdf');
        should(evt2.value).equal('purple');
    });
    it("RETROACTIVE is the timestamp for retroactive values", function() {
        // Retroactive date is JS minimum date. So there.
        should(TValue.RETROACTIVE.toJSON()).equal("-271821-04-20T00:00:00.000Z");
    });
    it("valueTags returns tvalue tags", function() {
        should.deepEqual(TValue.valueTags(), [
            "(none)",

            "dimensions",
            "id",
            "location",
            "name",
            "size",

        ]);
    });
    it("TValues are serializable", function() {
        var date = new Date(2018,2,10,7,30,10);
        var tv1 = new TValue({
            tag: Plant.T_POLLINATED,
            t: date,
            value: 'purple',
        });
        var json = JSON.parse(JSON.stringify(tv1));
        should.deepEqual(json, {
            t: date.toJSON(),
            tag: 'pollinated',
            value: 'purple',
        });

        var tv2 = new TValue(json);
        should.deepEqual(tv2, tv1);
    });

})
