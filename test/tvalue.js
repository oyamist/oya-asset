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
        should(evt.type).equal('begin');

        var date = new Date(2018, 3, 11);
        var evt2 = new TValue({
            t: date,
            type: Plant.T_GERMINATING,
            text: 'asdf',
            value: 'purple',
        });
        should.deepEqual(evt2.t, date);
        should(evt2.type).equal('germinating');
        should(evt2.text).equal('asdf');
        should(evt2.value).equal('purple');
    });
    it("valueTypes returns tvalue types", function() {
        should.deepEqual(TValue.valueTypes(), [
            "begin",
            "end",
            "location",
            "dimensions",
        ]);
    });
    it("TValues are serializable", function() {
        var date = new Date(2018,2,10,7,30,10);
        var tv1 = new TValue({
            type: Plant.T_POLLINATED,
            t: date,
            value: 'purple',
        });
        var json = JSON.stringify(tv1);
        var tv2 = new TValue(JSON.parse(json));
        should.deepEqual(tv2, tv1);
    });

})
