(function(exports) {
    const uuidv4 = require("uuid/v4");
    const TValue = require('./tvalue');
    const MSDAYS = 24*3600*1000;
    const SHORT_GUID_DIGITS = 7; // same as git default

    class Asset {
        constructor(opts = {}) {
            // core properties
            this.guid = opts.guid || this.guid || uuidv4();
            if (opts.hasOwnProperty('type')) {
                if (Asset.assetTypes().indexOf(opts.type) < 0) {
                    throw new Error(`Invalid type:${opts.type}`);
                }
                this.type = opts.type;
            } else {
                this.type = Asset.T_PLANT;
            }
            this.tvalues = (opts.tvalues || []).map(evt =>
                (evt instanceof TValue ? evt : new TValue(evt)));

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
                var t = opts.begin instanceof Date ? opts.begin : new Date(opts.begin);
                this.set(TValue.T_BEGIN, true, t);
            }
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

        namePrefix(opts={}) {
            return `${this.type}_`;
        }

        get id() { return this.get(TValue.T_ID); }
        set id(value) { this.set(TValue.T_ID, value); }

        get name() { return this.get(TValue.T_NAME); }
        set name(value) { this.set(TValue.T_NAME, value); }

        set(...args) {
            if (typeof args[0] === 'string') { // set(type,value,date)
                var tvalue = {
                    type: args[0],
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
        }

        snapshot(t=new Date()) {
            var snapshot = Object.assign({}, this);
            delete snapshot.tvalues;
            delete snapshot.name;
            var typeMap = {};
            return this.tvalues.reduce((snapshot,tvalue) => {    
                var valueType = tvalue.type;
                var tv = typeMap[valueType];
                if (!tv && tvalue.t <= t || tv && tv.t <= tvalue.t && tvalue.t <= t) {
                    snapshot[valueType] = tvalue.value;
                    typeMap[valueType] = tvalue;
                }
                return snapshot;
            }, snapshot);
        }

        getTValue(valueType, date = new Date()) {
            return this.tvalues.reduce((acc,evt) => {    
                if (evt.type === valueType) {
                   return evt.t<=date && (!acc || evt.t >= acc.t) ? evt : acc;
                }
                return acc;
            }, null);
        }

        get(valueType, date = new Date()) {
            var tvalue =  this.getTValue(valueType, date);
            return tvalue ? tvalue.value : null;
        }

        location(date = new Date()) {
            return this.get(TValue.T_LOCATION, date);
        }

        valueElapsed(targetType, startType = TValue.T_BEGIN) {
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
            var elapsed = this.valueElapsed(targetType, startType);
            return typeof elapsed === 'number' ?  this.ageElapsed(elapsed) : elapsed;
        }

        toJSON() {
            return this;
        }

        valueHistory(type) {
            return this.tvalues.filter(tv => tv.type === type).sort(TValue.compareTime);
        }

        updateSnapshot(snapNew, t = new Date(), text, snapBase=this.snapshot()) {
            Object.keys(snapNew).forEach(key => {
                var newValue = snapNew[key];
                var oldValue = snapBase[key];
                if (key === 'guid' || key === 'type') {
                    // skip
                } else if (newValue !== oldValue) {
                    this.set(new TValue({
                        t,
                        type: key,
                        value: newValue,
                        text,
                    }));
                } else {
                    // no change
                }
            })
        }

    } //// class Asset

    module.exports = exports.Asset = Asset;
})(typeof exports === "object" ? exports : (exports = {}));

