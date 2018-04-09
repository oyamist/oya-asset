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
    it("compare_t_tag(a,b) compares tvalues using (t,tag) as primary keys", function() {
        var t1 = new Date(2018,11,1);
        var t2 = new Date(2018,11,2);
        var tv1_color = new TValue({
            t: t1,
            tag: 'color',
            text: 'asdf',
            value: 'purple',
        });
        var tv2_color = new TValue({
            t: t2,
            tag: 'color',
            text: 'asdf',
            value: 'purple',
        });

        // t is primary sort key
        should(TValue.compare_t_tag(tv1_color,tv2_color)).equal(-1);
        should(TValue.compare_t_tag(tv2_color,tv1_color)).equal(1);
        should(TValue.compare_t_tag(tv1_color,tv1_color)).equal(0);

        // tag is secondary sort key
        var tv1_size = new TValue({
            t: t1,
            tag: 'size',
            text: 'asdf',
            value: 'large',
        });
        should('color').below('size');
        should(TValue.compare_t_tag(tv1_color,tv1_size)).equal(-1);
        should(TValue.compare_t_tag(tv1_size,tv1_color)).equal(1);

        // other properties are ignored
        var tv1_color_2 = new TValue({
            t: t1,
            tag: 'color',
            text: 'woof',
            value: 'red',
        });
        should(TValue.compare_t_tag(tv1_color,tv1_color_2)).equal(0);
    });
    it("TESTTESTmergeTValues(tv1,tv2) merges shorter into longer array", function() {
        var t = [
            new Date(2018,11,1),
            new Date(2018,11,2),
            new Date(2018,11,3),
            new Date(2018,11,4),
            new Date(2018,11,5),
            new Date(2018,11,6),
        ];
        var tv1 = [
            new TValue({t:t[0],text:'one'}),
            new TValue({t:t[1],text:'one'}),
            new TValue({t:t[3],text:'one'}),
            new TValue({t:t[4],text:'one'}),
        ];
        var tv2 = [
            new TValue({t:t[0],text:'two'}), // conflict with tv1[0]
            new TValue({t:t[2],text:'two'}),
        ];

        // The longer sequence is the primary sequence for conflicts
        should.deepEqual(TValue.mergeTValues(tv1, tv2), [
            tv1[0], tv1[1], tv2[1], tv1[2], tv1[3],
        ]);
        should.deepEqual(TValue.mergeTValues(tv2, tv1), [
            tv1[0], tv1[1], tv2[1], tv1[2], tv1[3],
        ]);

        // input sequences can be unordered
        var tv1_random = [
            new TValue({t:t[1],text:'one'}),
            new TValue({t:t[4],text:'one'}),
            new TValue({t:t[0],text:'one'}),
            new TValue({t:t[3],text:'one'}),
        ];
        var tv2_random = [
            new TValue({t:t[2],text:'two'}),
            new TValue({t:t[0],text:'two'}), // conflict with tv1[0]
        ];
        should.deepEqual(TValue.mergeTValues(tv1_random, tv2_random), [
            tv1[0], tv1[1], tv2[1], tv1[2], tv1[3],
        ]);
    });

})
