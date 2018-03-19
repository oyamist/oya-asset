(function(exports) {
    const uuidv4 = require("uuid/v4");
    const TValue = require('./tvalue');
    const MSDAYS = 24*3600*1000;
    const RETROACTIVE = new Date(0); // January 1, 1970 UTC (just because)
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

            // id appears on the asset tag, which can be lost and replaced
            // id is therefore a temporal value 
            if (opts.hasOwnProperty('id')) {
                // in common usage, the initial setting of an id is retroactive
                this.set(TValue.T_ID, opts.id, RETROACTIVE);
            } else if (opts.tvalues) {
                // id is in the tvalues
            } else {
                this.set(TValue.T_ID, this.guid.substr(0,SHORT_GUID_DIGITS), RETROACTIVE);
            }

            Object.defineProperty(this, "_name", {
                writable: true,
            });
            Object.defineProperty(this, "name", {
                enumerable: true,
                get() {
                    if (this._name){
                        return this._name;
                    }
                    var id = this.get(TValue.T_ID);
                    return id && `${this.type}_${id}`
                        || `${this.type}_${this.guid.substr(0,6)}`;
                },
                set(value) {
                    this._name = value;
                },
            });

            this._name = opts.name || this._name;
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

        get id() { return this.get(TValue.T_ID); }
        set id(value) { this.set(TValue.T_ID, value); }

        set(...args) {
            if (typeof args[0] === 'string') { // set(type,value,date)
                var tvalue = {
                    type: args[0],
                    value: args[1] === undefined ? true : args[1],
                    t: args[2] || new Date(),
                };
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
            var typeMap = {};
            return this.tvalues.reduce((snapshot,evt) => {    
                var valueType = evt.type;
                var tv = typeMap[valueType];
                if (!tv && evt.t <= t || tv && tv.t <= evt.t && evt.t <= t) {
                    snapshot[valueType] = evt.value;
                    typeMap[valueType] = evt;
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

    } //// class Asset

    module.exports = exports.Asset = Asset;
})(typeof exports === "object" ? exports : (exports = {}));

