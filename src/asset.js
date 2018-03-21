(function(exports) {
    const uuidv4 = require("uuid/v4");
    const TValue = require('./tvalue');
    const MSDAYS = 24*3600*1000;
    const SHORT_GUID_DIGITS = 7; // same as git default
    const ISODATE = /^\d\d\d\d-\d\d-\d\d/;

    class Asset {
        constructor(opts = {}) {
            // core properties
            this.guid = opts.guid || this.guid || uuidv4();
            if (opts.hasOwnProperty('type')) {
                Asset.validateType(opts.type);
                if (Asset.assetTypes().indexOf(opts.type) < 0) {
                    throw new Error(`Invalid type:${opts.type}`);
                }
                this.type = opts.type;
            } else {
                this.type = Asset.T_PLANT;
            }
            Object.defineProperty(this, "tvalues", {
                writable: true,
                value: (opts.tvalues || []).map(tv =>
                    (tv instanceof TValue ? tv : new TValue(tv))),
            });

            // Asset id is retroactive temporal value initializable with ctor options
            if (opts.hasOwnProperty('id')) {
                this.set(TValue.T_ID, opts.id, TValue.RETROACTIVE);
            } else if (opts.tvalues) {
                // id is in the tvalues
            } else {
                this.set(TValue.T_ID, this.guid.substr(0,SHORT_GUID_DIGITS), TValue.RETROACTIVE);
            }

            // Asset name is retroactive temporal value initializable with ctor options
            if (opts.hasOwnProperty('name')) {
                this.set(TValue.T_NAME, opts.name, TValue.RETROACTIVE);
            } else if (opts.tvalues) {
                // name is in tvalues
            } else {
                var name = `${this.namePrefix(opts)}${this.id}`;
                this.set(TValue.T_NAME, name, TValue.RETROACTIVE);
            }
            if (opts.begin) {
                this.begin = opts.begin instanceof Date ? opts.begin : new Date(opts.begin);
            } else {
                this.begin = new Date();
            }
            this.end = opts.end || null;
        }

        static get T_ACTUATOR() { return "actuator"; }
        static get T_LIGHT() { return "light"; }
        static get T_MCU() { return "mcu"; }
        static get T_PLANT() { return "plant"; }
        static get T_PUMP() { return "pump"; }
        static get T_RESERVOIR() { return "reservoir"; }
        static get T_SENSOR() { return "sensor"; }
        static get T_TENT() { return "tent"; }

        static assetTypes() {
            return [
                Asset.T_ACTUATOR,
                Asset.T_LIGHT,
                Asset.T_MCU,
                Asset.T_PLANT,
                Asset.T_PUMP,
                Asset.T_RESERVOIR,
                Asset.T_SENSOR,
                Asset.T_TENT,

            ];
        }

        static validateType(type) {
            if (type == null) {
                throw new Error("Value type is required");
            }
            return type;
        }

        namePrefix(opts={}) {
            return `${this.type}_`;
        }

        get id() { return this.get(TValue.T_ID); }
        set id(value) { this.set(TValue.T_ID, value); return value; }

        get name() { return this.get(TValue.T_NAME); }
        set name(value) { this.set(TValue.T_NAME, value); return value; }

        set(...args) {
            if (typeof args[0] === 'string') { // set(type,value,date)
                var type = Asset.validateType(args[0]);
                var tvalue = {
                    type,
                    value: args[1] === undefined ? true : args[1],
                    t: args[2] || new Date(),
                };
                args[3] && (tvalue.text = args[3]+'');
            } else { // set(tvalue)
                var tvalue = args[0];
            }
            if (tvalue == null) {
                throw new Error('Asset.set(tvalue) tvalue is required');
            }
            if (!(tvalue instanceof TValue)) {
                tvalue = new TValue(tvalue);
            }
            this.tvalues.push(tvalue);
            return undefined; // TBD
        }

        getTValue(valueType, date = new Date()) {
            Asset.validateType(valueType);
            return this.tvalues.reduce((acc,evt) => {    
                if (evt.type === valueType) {
                   return evt.t<=date && (!acc || evt.t >= acc.t) ? evt : acc;
                }
                return acc;
            }, null);
        }

        get(valueType, date = new Date()) {
            Asset.validateType(valueType);
            var tvalue =  this.getTValue(valueType, date);
            if (tvalue && tvalue.value === true) {
                return tvalue.t;
            }
            return tvalue ? tvalue.value : undefined;
        }

        location(date = new Date()) {
            return this.get(TValue.T_LOCATION, date);
        }

        valueElapsed(targetType, startType = TValue.T_BEGIN) {
            Asset.validateType(targetType);
            Asset.validateType(startType);
            var eStart = this.getTValue(startType);
            if (eStart == null) {
                throw new Error(`${this.name} has no tvalue:${startType}`);
            }
            if (!(eStart.t instanceof Date)) {
                throw new Error(`${this.name} has no timestamp for start tvalue:${startType}`);
            }
            var eTarget = this.getTValue(targetType);
            if (eTarget == null) {
                return null; // hasn't happened yet
            }
            if (!(eTarget.t instanceof Date)) {
                throw new Error(`${this.name} has no timestamp for target tvalue:${targetType}`);
            }
            return eTarget.t-eStart.t;
        }

        ageElapsed(elapsed) {
            return Math.trunc(elapsed/MSDAYS);
        }

        age() {
            var eStart = this.getTValue(TValue.T_BEGIN);

            if (eStart == null) {
                throw new Error(`${this.name} has no tvalue:${startType}`);
            }
            var eEnd = this.getTValue(TValue.T_END);
            var elapsed = (eEnd ? eEnd.t : Date.now()) - eStart.t;
            return this.ageElapsed(elapsed);
        }

        ageAt(targetType, startType = TValue.T_BEGIN) {
            Asset.validateType(targetType);
            Asset.validateType(startType);
            var elapsed = this.valueElapsed(targetType, startType);
            return typeof elapsed === 'number' ?  this.ageElapsed(elapsed) : elapsed;
        }

        toJSON() {
            return Object.assign({
                tvalues: this.tvalues,
            }, this);
        }

        valueHistory(type) {
            Asset.validateType(type);
            return this.tvalues.filter(tv => tv.type === type).sort(TValue.compareTime);
        }

        updateValueHistory(type, history) {
            Asset.validateType(type);
            var tvalues = this.tvalues.filter(tv => tv.type !== type);
            tvalue.concat(history.filter(tv => tv.type === type));
            this.tvalues = tvalues;
            return undefined; // TBD
        }

        snapshot(t=new Date()) {
            var snapshot = JSON.parse(JSON.stringify(this));
            delete snapshot.tvalues;
            delete snapshot.name;
            var typeMap = {};
            return this.tvalues.reduce((snapshot,tvalue) => {    
                var valueType = tvalue.type;
                var tv = typeMap[valueType];
                if (!tv && tvalue.t <= t || tv && tv.t <= tvalue.t && tvalue.t <= t) {
                    if (tvalue.value === true) { 
                        snapshot[valueType] = tvalue.t.toJSON(); // coerce to date
                    } else {
                        snapshot[valueType] = tvalue.value;
                    }
                    typeMap[valueType] = tvalue;
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
                        this.set(new TValue({
                            t: new Date(newValue),
                            type: key,
                            value: true,
                            text,
                        }));
                    } else {
                        this.set(new TValue({
                            t,
                            type: key,
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

    } //// class Asset

    module.exports = exports.Asset = Asset;
})(typeof exports === "object" ? exports : (exports = {}));

