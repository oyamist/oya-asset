(function(exports) {
    const uuidv4 = require("uuid/v4");
    const TValue = require('./tvalue');
    const MSDAYS = 24*3600*1000;

    class Asset {
        constructor(opts = {}) {
            Object.defineProperty(this, "_name", {
                writable: true,
            });
            Object.defineProperty(this, "name", {
                enumerable: true,
                get() {
                    return this._name 
                        || this.id && `${this.type}_${this.id}`
                        || `${this.type}_${this.guid.substr(0,6)}`;
                },
                set(value) {
                    this._name = value;
                },
            });
            this.update(opts);
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

        update(opts={}) {
            if (opts.hasOwnProperty('type')) {
                if (Asset.assetTypes().indexOf(opts.type) < 0) {
                    throw new Error(`Invalid type:${opts.type}`);
                }
                this.type = opts.type;
            } else {
                this.type = this.type || Asset.T_PLANT;
            }
            this.id = opts.id || this.id;
            this.guid = opts.guid || this.guid || uuidv4();
            this.tvalues = (opts.tvalues || this.tvalues || []).map(evt =>
                (evt instanceof TValue ? evt : new TValue(evt)));
            this._name = opts.name || this._name;
            if (opts.begin) {
                var t = opts.begin instanceof Date ? opts.begin : new Date(opts.begin);
                this.set(TValue.T_BEGIN, true, t);
            }
        }

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

