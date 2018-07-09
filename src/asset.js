(function(exports) {
    const uuidv4 = require("uuid/v4");
    const TValue = require('./tvalue');
    const MSDAYS = 24*3600*1000;
    const SHORT_GUID_DIGITS = 7; // same as git default
    const ISODATE = /^\d\d\d\d-\d\d-\d\d/;
    const JSON_DATE = /^\d\d\d\d-\d\d-\d\dT\d\d:\d\d:\d\d/;
    
    // Assets have different kinds of properties:
    // * immutable non-temporal properties (e.g., guid) 
    // * mutable non-temporal properties (e.g., cultivar) 
    // * standard temporal properties (e.g., pollinated) are undefined till set
    // * retroactive temporal properties (e.g., id) have values that predate their creation

    class Asset {
        constructor(opts = {}) {
            // core properties
            this.guid = opts.guid || this.guid || uuidv4();
            if (opts.hasOwnProperty('type')) {
                if (Asset.assetTypes().indexOf(opts.type) < 0) {
                    throw new Error(`Invalid asset type:${opts.type}`);
                }
                this.type = opts.type;
            } else {
                this.type = Asset.T_ASSET;
            }
            Object.defineProperty(this, "tvalues", {
                enumerable: true,
                writable: true,
                value: (opts.tvalues || []).map(tv =>
                    (tv instanceof TValue ? tv : new TValue(tv))),
            });

            // ctor properties are non-temporal
            var keys = Object.keys(opts).filter(key => 
                key !== 'type' && // immutable non-temporal
                key !== 'guid' && // immutable non-temporal
                key !== 'id' && // retroactive temporal
                key !== 'begin' && // mutable non-temporal
                key !== 'tvalues' && // temporal implementation 
                key !== 'name');// retroactive temporal
            keys.forEach(key => {
                this[key] = opts[key];
            });

            // Asset id is retroactive temporal value initializable with ctor options
            if (opts.hasOwnProperty('id')) {
                this.setTValue(TValue.T_ID, opts.id, TValue.RETROACTIVE);
            } else if (opts.tvalues) {
                // id is in the tvalues
            } else {
                this.setTValue(TValue.T_ID, this.guid.substr(0,SHORT_GUID_DIGITS), TValue.RETROACTIVE);
            }

            // Asset name is retroactive temporal value initializable with ctor options
            if (opts.hasOwnProperty('name')) {
                this.setTValue(TValue.T_NAME, opts.name, TValue.RETROACTIVE);
            } else if (opts.tvalues) {
                // name is in tvalues
            } else {
                var name = `${this.namePrefix(opts)}${this.id}`;
                this.setTValue(TValue.T_NAME, name, TValue.RETROACTIVE);
            }
            if (opts.begin) {
                this.begin = opts.begin instanceof Date ? opts.begin : new Date(opts.begin);
            } else {
                this.begin = new Date();
            }
            this.end = opts.end || null;
        }

        static get JSON_DATE() { return JSON_DATE; }

        static get T_ACTUATOR() { return "actuator"; }
        static get T_ADDRESS() { return "address"; }
        static get T_ASSET() { return "asset"; }
        static get T_LIGHT() { return "light"; }
        static get T_ENCLOSURE() { return "enclosure"; }
        static get T_PLANT() { return "plant"; }
        static get T_VENDOR() { return "vendor"; }
        static get T_NUTRIENT() { return "nutrient"; }
        static get T_COMPUTER() { return "computer"; }
        static get T_PUMP() { return "pump"; }
        static get T_RESERVOIR() { return "reservoir"; }
        static get T_SENSOR() { return "sensor"; }

        static compareId(a,b) {
            if (a.id < b.id) {
                return -1;
            }
            return  (a.id === b.id) ? 0 : 1;
        }
        static compareGuid(a,b) {
            if (a.guid < b.guid) {
                return -1;
            }
            return  (a.guid === b.guid) ? 0 : 1;
        }

        static assetTypes() {
            return [
                Asset.T_ACTUATOR,
                Asset.T_ADDRESS,
                Asset.T_ASSET,
                Asset.T_COMPUTER,
                Asset.T_ENCLOSURE,
                Asset.T_LIGHT,
                Asset.T_NUTRIENT,
                Asset.T_PLANT,
                Asset.T_PUMP,
                Asset.T_RESERVOIR,
                Asset.T_SENSOR,
                Asset.T_VENDOR,

            ];
        }

        validateTag(tag) {
            if (tag == null) {
                throw new Error("Temporal value tag is required");
            }
            if (this.hasOwnProperty(tag)) {
                throw new Error(`Property "${tag}" is not a temporal property`);
            }
            return tag;
        }

        describeProperty(name) {
            var retroTime = TValue.RETROACTIVE.getTime();
            var retroDate = TValue.RETROACTIVE.toJSON();
            var { 
                temporal,
                retroactive,
            } = this.tvalues.reduce((acc,tv) => {
                    if (tv.tag === name) {
                        acc.temporal = true;
                        if (tv.t.getTime() === retroTime) {
                            acc.retroactive = true;
                        }
                    }
                return acc;
            }, {
                temporal: false,
                retroactive: false,
            });
            return {
                name,
                mutable: name !== 'guid' && name !== 'type',
                temporal,
                retroactive,
                own: this.hasOwnProperty(name),
            }
        }

        namePrefix(opts={}) {
            return `${this.type}_`;
        }

        get id() { return this.get(TValue.T_ID); }
        set id(value) { this.setTValue(TValue.T_ID, value); return value; }

        get name() { return this.get(TValue.T_NAME); }
        set name(value) { this.setTValue(TValue.T_NAME, value); return value; }

        setTValue(...args) {
            if (typeof args[0] === 'string') { // set(tag,value,date)
                var tag = args[0];
                var tvalue = {
                    tag,
                    value: args[1] === undefined ? TValue.V_EVENT : args[1],
                    t: args[2] || new Date(),
                };
                if (this.hasOwnProperty(args[0])) { // non-temporal
                    if (tag === 'guid' || tag === 'type') {
                        throw new Error(`Attempt to change immutable property:${tag}`);
                    }
                    this[tag] = tvalue.value;
                    return undefined; // TBD
                }
                this.validateTag(tag);
                args[3] && (tvalue.text = args[3]+'');
            } else { // set(tvalue)
                var tvalue = args[0];
            }
            if (tvalue == null) {
                throw new Error('Asset.setTValue(tvalue) tvalue is required');
            }
            if (!(tvalue instanceof TValue)) {
                tvalue = new TValue(tvalue);
            }
            this.tvalues.push(tvalue);
            return undefined; // TBD
        }

        getTValue(valueTag, date = new Date()) {
            this.validateTag(valueTag);
            return this.tvalues.reduce((acc,evt) => {    
                if (evt.tag === valueTag) {
                   return evt.t<=date && (!acc || evt.t >= acc.t) ? evt : acc;
                }
                return acc;
            }, null);
        }

        get(valueTag, date = new Date()) {
            if (this.hasOwnProperty(valueTag)) {
                return this[valueTag]; // non-temporal property
            }
            this.validateTag(valueTag);
            var tvalue =  this.getTValue(valueTag, date);
            if (tvalue && tvalue.value === TValue.V_EVENT) {
                return tvalue.t;
            }
            return tvalue ? tvalue.value : undefined;
        }

        location(date = new Date()) {
            return this.get(TValue.T_LOCATION, date);
        }

        valueElapsed(targetType) {
            this.validateTag(targetType);
            if (this.begin == null) {
                throw new Error(`${this.name} has no tvalue:${startType}`);
            }
            if (!(this.begin instanceof Date)) {
                throw new Error(`${this.name} has no timestamp for start tvalue:${startType}`);
            }
            var eTarget = this.getTValue(targetType);
            if (eTarget == null) {
                return null; // hasn't happened yet
            }
            if (!(eTarget.t instanceof Date)) {
                throw new Error(`${this.name} has no timestamp for target tvalue:${targetType}`);
            }
            return eTarget.t-this.begin;
        }

        ageElapsed(elapsed) {
            return Math.trunc(elapsed/MSDAYS);
        }

        age() {
            if (this.begin == null) {
                throw new Error(`${this.name} has no begin date`);
            }
            var elapsed = (this.end ? this.end : Date.now()) - this.begin;
            return this.ageElapsed(elapsed);
        }

        ageAt(targetType) {
            this.validateTag(targetType);
            var elapsed = this.valueElapsed(targetType);
            return typeof elapsed === 'number' ?  this.ageElapsed(elapsed) : elapsed;
        }

        toJSON() {
            return this;
        }

        valueHistory(tag) {
            this.validateTag(tag);
            return this.tvalues.filter(tv => tv.tag === tag).sort(TValue.compareTime);
        }

        updateValueHistory(tag, history) {
            this.validateTag(tag);
            var tvalues = this.tvalues.filter(tv => tv.tag !== tag);
            tvalue.concat(history.filter(tv => tv.tag === tag));
            this.tvalues = tvalues;
            return undefined; // TBD
        }

        snapshot(t=new Date()) {
            var snapshot = JSON.parse(JSON.stringify(this));
            delete snapshot.tvalues;
            delete snapshot.name;
            var tagMap = {};
            return this.tvalues.reduce((snapshot,tvalue) => {    
                var valueTag = tvalue.tag;
                var tv = tagMap[valueTag];
                if (!tv && tvalue.t <= t || tv && tv.t <= tvalue.t && tvalue.t <= t) {
                    if (tvalue.value === TValue.V_EVENT) { 
                        snapshot[valueTag] = tvalue.t.toJSON(); // coerce to date
                    } else {
                        snapshot[valueTag] = tvalue.value;
                    }
                    tagMap[valueTag] = tvalue;
                }
                return snapshot;
            }, snapshot);
        }

        updateSnapshot(snapNew, t = new Date(), text, snapBase=this.snapshot()) {
            Object.keys(snapNew).forEach(key => {
                var newValue = snapNew[key];
                var oldValue = snapBase[key];
                if (key === 'guid' || key === 'type') {
                    if (newValue !== oldValue) {
                        throw new Error(`Asset ${key} cannot be changed`);
                    }
                } else if (newValue !== oldValue) {
                    if ((typeof newValue === 'string') && newValue.match(ISODATE)) {
                        this.setTValue(new TValue({
                            t: new Date(newValue),
                            tag: key,
                            value: TValue.V_EVENT,
                            text,
                        }));
                    } else {
                        this.setTValue(new TValue({
                            t,
                            tag: key,
                            value: newValue,
                            text,
                        }));
                    }
                } else {
                    // no change
                }
            })
            return undefined; // TBD
        }

        static merge(asset1, asset2) {
            if (asset1.guid !== asset2.guid) {
                throw new Error(`Assets with different guids cannot be merged: asset1:${asset1.guid} asset2:${asset2.guid}`);
            }
            if (asset1.tvalues.length < asset2.tvalues.length) {
                [asset1, asset2] = [asset2, asset1]; // asset1 is primary asset
            }
            var merged = new Asset(asset1);
            merged.tvalues = TValue.mergeTValues(asset1.tvalues, asset2.tvalues);
            return merged;
        }

        static keyDisplayValue(key, asset, assetMap={}, language='en-us') {
            var value = asset[key];
            if (key === 'guid') {
                return value;
            } 
            if (typeof value !== 'string') {
                return value;
            } 
            var valueAsset = assetMap[value]; // if value is a guid, show referenced asset summary
            if (valueAsset && valueAsset !== asset) {
                return `${valueAsset.name} \u2666 ${valueAsset.id} \u2666 ${valueAsset.type}`;
            }

            if (value.match(JSON_DATE)) {
                var date = new Date(value);
                var end = asset.end || Date.now();
                var msElapsed = end - date;
                var days = (Math.round(msElapsed / (24*3600*1000))).toFixed(0);
                if (days < 14) {
                    var dateStr = date.toLocaleDateString(language, {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                    });
                } else if (days < 365) {
                    var dateStr = date.toLocaleDateString(language, {
                        month: 'short',
                        day: 'numeric',
                    });
                } else {
                    var dateStr = date.toLocaleDateString(language, {
                        month: 'numeric',
                        day: '2-digit',
                        year:'2-digit',
                    });
                }
                var timeStr = date.toLocaleTimeString(language, {
                    hour: '2-digit',
                    minute: '2-digit',
                });
                if (key !== 'begin' && asset.begin) {
                    var begin = new Date(asset.begin);
                    var age = Math.trunc((date - begin)/(24*3600*1000));
                    return `${dateStr} (${-days} days @ ${age} days) \u2666 ${timeStr}`;
                } else {
                    return `${dateStr} (${-days} days) \u2666 ${timeStr}`;
                }
            }
            return value;
        }

    } //// class Asset

    module.exports = exports.Asset = Asset;
})(typeof exports === "object" ? exports : (exports = {}));

