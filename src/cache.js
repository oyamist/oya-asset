(function(exports) {
    const winston = require('winston');
    const Asset = require('./asset');
    const TValue = require('./tvalue');

    class Cache {
        constructor(opts={}) {
            this.update(opts);
        }

        update(opts={}) {
            var self = this;
            this.map = opts.map || {};
            for (let entry of this) {
                (entry instanceof Date) || (entry.t = new Date(entry.t));
            }
            this.fetch = opts.fetch || ((key) => Promise.resolve(undefined));
            var p = this.fetch(null);
            if (!(p instanceof Promise)) {
                throw new Error(`Cache.update() fetch must return a Promise`);
            }
            p.catch(e=>null); // ignore error
            this.maxSize = opts.maxSize || 1000;
            this.cull = opts.cull || Cache.CULL_LRU;
        }

        clear() {
            this.map = {};
        }

        size() {
            return Object.keys(this.map).length;
        }

        static COMPARE_ENTRY_KEY(entry1, entry2) {
            if (entry1 === entry2) {
                return 0;
            }
            if (entry1.key === entry2.key) {
                return 0;
            }
            return (entry1.key < entry2.key) ? -1 : 1;
        }

        static COMPARE_ENTRY_LRU(entry1, entry2) {
            if (entry1 === entry2) {
                return COMPARE_ENTRY_KEY(entry1, entry2);
            }
            if (entry1.t === entry2.t) {
                return COMPARE_ENTRY_KEY(entry1, entry2);
            }
            return (entry1.t < entry2.t) ? -1 : 1;
        }

        static CULL_LRU(n, map) {
            if (n <= 0) {
                return [];
            }

            var keys = Object.keys(map);
            keys.sort((k1,k2) => {
                var entry1 = this.map[k1];
                var entry2 = this.map[k2];

                return entry1.t - entry2.t;
            });
            var removed = keys.slice(0,n);
            removed.forEach(key => {
                delete this.map[key];
            });
            return removed;
        }

        entryOf(key) {
            return this.map[key];
        }

        toJSON() {
            var map = {};
            for (let entry of this) {
                map[entry.key] = {
                    key: entry.key,
                    t: entry.t,
                };
            };
            return {
                map,
                maxSize: this.maxSize,
            }
        }

        put(key, obj=key, t=new Date()) {
            var entry = { key, obj, t, };
            this.map[key] = entry;
            var excess = (this.size() - this.maxSize);
            excess > 0 && this.cull(excess, this.map);
            return entry;
        }

        get(key, t) {
            var e = new Error(`Cache.get() fetch(${key}) not found`);
            return new Promise((resolve, reject) => {
                try {
                    var entry = this.map[key];
                    var obj =  entry && entry.obj || undefined;
                    if (obj) {
                        entry.t = t || new Date(); // update timestamp
                        resolve(obj);
                    } else {
                        this.fetch(key).then(obj=>{
                            if (obj) {
                                this.put(key, obj, t);
                                resolve(obj);
                            } else {
                                winston.info(e.stack);
                                reject(e);
                            }
                        }).catch(e=>reject(e));
                    }
                } catch(e) {
                    winston.info(e.stack);
                    reject(e);
                }
            });
        }

    } // Cache

    Cache.prototype[Symbol.iterator] = function*() {
        var entries = [];
        var keys = Object.keys(this.map);
        for (var i = 0; i < keys.length; i++) {
            yield this.map[keys[i]];
        }
    };


    module.exports = exports.Cache = Cache;
})(typeof exports === "object" ? exports : (exports = {}));

