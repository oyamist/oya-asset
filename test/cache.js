(typeof describe === 'function') && describe("Cache", function() {
    const winston = require('winston');
    const should = require("should");
    const {
        Asset,
        Cache,
        TValue,

    } = require("../index");
    var assets = [];
    for (var i = 1; i<100; i++) {
        var num = ('000' + i).substring(-4);
        assets.push(new Asset({
            id: `A${num}`,
            guid: `GUID${num}`,
        }));
    }
    var t = [
        new Date(2018, 1, 1),
        new Date(2018, 1, 2),
        new Date(2018, 1, 3),
        new Date(2018, 1, 4),
        new Date(2018, 1, 5),
        new Date(2018, 1, 6),
        new Date(2018, 1, 7),
        new Date(2018, 1, 8),
        new Date(2018, 1, 9),
        new Date(2018, 1, 10),
    ];

    it("Cache(opts) creates a cache", function() {
        var cache = new Cache();
        should(cache).properties({
            maxSize: 1000,
        });
    });

    it("put(key, obj,t) adds an object to the cache", function() {
        var cache = new Cache();
        should(cache.size()).equal(0);

        // add new objects to cache
        cache.put(assets[0].guid, assets[0], t[0]);
        should(cache.size()).equal(1);
        cache.put(assets[1].guid, assets[1], t[1]);
        should(cache.size()).equal(2);

        // add existing object to cache
        cache.put(assets[0].guid, assets[0], t[2]);
        should(cache.size()).equal(2);
    })
    it("get(key) gets an object from the cache", function(done) {
        var async = function*() {
            try {
                var cache = new Cache();
                should(cache.size()).equal(0);

                cache.put(assets[0].guid, assets[0], t[0]);
                cache.put(assets[1].guid, assets[1], t[1]);

                // objects in the cache are returnd
                var asset = yield cache.get(assets[0].guid)
                    .then(r=>async.next(r)).catch(e=>done(e));
                should(asset).equal(assets[0]);
                var asset = yield cache.get(assets[1].guid)
                    .then(r=>async.next(r)).catch(e=>done(e));
                should(asset).equal(assets[1]);

                // return Error if object is not found
                var asset = yield cache.get(assets[2].guid)
                    .then(r=>async.next(r)).catch(e=>async.next(e));
                should(asset).instanceOf(Error);

                done();
            } catch(e) {
                done(e);
            }
        }();
        async.next();
    })
    it("client fetches objects missing from cache", function(done) {
        var async = function*() {
            try {
                var fetches = 0;
                function myFetch(guid) {
                    return new Promise((resolve, reject) => {
                        fetches++;
                        resolve( 
                            assets.reduce((acc,asset) => {
                                return acc || (asset.guid === guid) && asset;
                            }, undefined)
                        );
                    });
                }

                var cache = new Cache({
                    fetch: myFetch,
                });
                should(fetches).equal(1); // fetch(null)
                should(cache.size()).equal(0);

                cache.put(assets[0].guid, assets[0], t[0]);
                cache.put(assets[1].guid, assets[1], t[1]);
                should(cache.size()).equal(2);

                // an object in the cache is returned directly
                var asset = yield cache.get(assets[0].guid)
                    .then(r=>async.next(r)).catch(e=>done(e));
                should(asset).equal(assets[0]);
                should(fetches).equal(1);
                should(cache.size()).equal(2);

                // object not in cache will be fetched
                var asset = yield cache.get(assets[2].guid)
                    .then(r=>async.next(r)).catch(e=>done(e));
                should(asset).equal(assets[2]);
                should(fetches).equal(2);
                should(cache.size()).equal(3);

                // once in the cache, they won't be fetched again
                var asset = yield cache.get(assets[2].guid)
                    .then(r=>async.next(r)).catch(e=>done(e));
                should(asset).equal(assets[2]);
                should(fetches).equal(2);
                should(cache.size()).equal(3);

                done();
            } catch(e) {
                done(e);
            }
        }();
        async.next();
    });
    it("objects are removed from cache to maintain maxSize", function() {
        var cache = new Cache({
            maxSize: 3,
        });

        cache.put(assets[0].guid, assets[0], t[0]);
        cache.put(assets[1].guid, assets[1], t[1]);
        cache.put(assets[2].guid, assets[2], t[2]);
        should(cache.size()).equal(3);

        cache.put(assets[3].guid, assets[3], t[3]);
        should(cache.size()).equal(3);
    });
    it("entry(key) returns cache entry", function() {
        var cache = new Cache();

        // entry for something in cache
        cache.put(assets[0].guid, assets[0], t[0]);
        should.deepEqual(cache.entry(assets[0].guid), {
            key: assets[0].guid,
            obj: assets[0],
            t: t[0],
        });

        // entry for non-existent objecdt
        should.deepEqual(cache.entry('nobody'), undefined);
    });
    it("is iterable", function() {
        // empty cache
        var cache = new Cache();
        should.deepEqual([...cache], []);

        // one entry
        cache.put(assets[1].guid, assets[1], t[1]);
        var entries = [...cache];
        should.deepEqual(entries, [{
            key: assets[1].guid,
            obj: assets[1],
            t: t[1],
        }]);

        // two entries
        cache.put(assets[0].guid, assets[0], t[0]);
        should.deepEqual([...cache], [{
            key: assets[0].guid,
            obj: assets[0],
            t: t[0],
        },{
            key: assets[1].guid,
            obj: assets[1],
            t: t[1],
        }].sort(Cache.COMPARE_ENTRY));
    });
    it("is serializable", function(done) {
        var async = function*() {
            try {
                var fetches = 0;
                function myFetch(guid) {
                    return new Promise((resolve, reject) => {
                        fetches++;
                        resolve( 
                            assets.reduce((acc,asset) => {
                                return acc || (asset.guid === guid) && asset;
                            }, undefined)
                        );
                    });
                }
                var cache = new Cache({
                    fetch: myFetch,
                });
                cache.put(assets[0].guid, assets[0], t[0]);
                var asset = yield cache.get(assets[0].guid).then(r=>async.next(r)).catch(e=>done(e));
                should.deepEqual(asset, assets[0]);
                var entry0 = cache.entry(assets[0].guid);
                var json = JSON.parse(JSON.stringify(cache));
                should.deepEqual(Object.keys(json).sort(), [
                    "map",
                    "maxSize",
                ].sort());

                var cache2 = new Cache(Object.assign({
                    fetch: myFetch,
                },json));
                should.deepEqual(cache2.entry(assets[0].guid), {
                    key: assets[0].guid,
                    t: t[0],
                });
                var asset = yield cache2.get(assets[0].guid)
                    .then(r=>async.next(r)).catch(e=>done(e));
                should.deepEqual(asset, assets[0]);
                done();
            } catch(e) {
                done(e);
            }
        }();
        async.next();
    });
    
})