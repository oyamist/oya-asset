(typeof describe === 'function') && describe("Filter", function() {
    const winston = require('winston');
    const should = require("should");
    const {
        Asset,
        Filter,
        Inventory,
        Plant,
        TValue,

    } = require("../index");
    
    it("TValueFilter(tvalue, op) matches asset", function() {
        var asset = new Asset();
        var t1 = new Date(2018,1,10);
        var t2 = new Date(2018,1,11);
        asset.set("size", 32, t1);
        asset.set("size", 40, t2);
        should(asset.get("size", t1)).equal(32);
        var tv32 = new TValue({ 
            tag: "size",
            value: 32,
        });
        var tv40 = new TValue({ 
            tag: "size",
            value: 40,
        });
        var tv50 = new TValue({ 
            tag: "size",
            value: 50,
        });
        var tv32_t1 = new TValue({ 
            tag: "size",
            value: 32,
            t: t1,
        });
        var filter = new Filter.TValueFilter(Filter.OP_EQ, tv32);
        should(filter.matches(asset)).equal(false);
        var filter = new Filter.TValueFilter(Filter.OP_EQ, tv32_t1);
        should(filter.matches(asset)).equal(true);
        var filter = new Filter.TValueFilter(Filter.OP_EQ, tv40);
        should(filter.matches(asset)).equal(true);

        var filter = new Filter.TValueFilter(Filter.OP_GE, tv40);
        should(filter.matches(asset)).equal(true);
        var filter = new Filter.TValueFilter(Filter.OP_GE, tv50);
        should(filter.matches(asset)).equal(false);

        var filter = new Filter.TValueFilter(Filter.OP_GT, tv40);
        should(filter.matches(asset)).equal(false);
        var filter = new Filter.TValueFilter(Filter.OP_GT, tv32);
        should(filter.matches(asset)).equal(true);

        var filter = new Filter.TValueFilter(Filter.OP_LT, tv50);
        should(filter.matches(asset)).equal(true);
        var filter = new Filter.TValueFilter(Filter.OP_LT, tv40);
        should(filter.matches(asset)).equal(false);

        var filter = new Filter.TValueFilter(Filter.OP_LE, tv40);
        should(filter.matches(asset)).equal(true);
        var filter = new Filter.TValueFilter(Filter.OP_LE, tv32);
        should(filter.matches(asset)).equal(false);
    });

})
