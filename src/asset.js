(function(exports) {
    const uuidv4 = require("uuid/v4");
    const Event = require('./event');
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
            this.events = (opts.events || this.events || []).map(evt =>
                (evt instanceof Event ? evt : new Event(evt)));
            this._name = opts.name || this._name;
        }

        addEvent(event) {
            if (event == null) {
                throw new Error('Asset.addEvent() event is required');
            }
            if (!(event instanceof Event)) {
                event = new Event(event);
            }
            this.events.push(event);
        }

        eventValue(eventType, date = new Date()) {
            var evt =  this.events.reduce((acc,evt) => {    
               return evt.type === eventType && evt.t<=date ? evt : acc;
            }, null);
            return evt ? evt.value : null;
        }

        location(date = new Date()) {
            return this.eventValue(Event.T_LOCATION, date);
        }

        firstEvent(eventType = Event.T_BEGIN) {
            return this.events.reduce((acc,evt) => 
                (acc || evt.type === eventType && evt || acc), null);
        }

        eventElapsed(targetType, startType = Event.T_BEGIN) {
            var eStart = this.firstEvent(startType);
            if (eStart == null) {
                throw new Error(`${this.name} has no event:${startType}`);
            }
            if (!(eStart.t instanceof Date)) {
                throw new Error(`${this.name} has no timestamp for start event:${startType}`);
            }
            var eTarget = this.firstEvent(targetType);
            if (eTarget == null) {
                return null; // hasn't happened yet
            }
            if (!(eTarget.t instanceof Date)) {
                throw new Error(`${this.name} has no timestamp for target event:${targetType}`);
            }
            return eTarget.t-eStart.t;
        }

        ageElapsed(elapsed) {
            return Math.trunc(elapsed/MSDAYS);
        }

        age() {
            var eStart = this.firstEvent(Event.T_BEGIN);
            if (eStart == null) {
                throw new Error(`${this.name} has no event:${startType}`);
            }
            var eEnd = this.firstEvent(Event.T_END);
            if (eEnd) {
                var elapsed = eEnd.t - eStart.t;
            } else {
                var elapsed = Date.now() - eStart.t;
            }
            return this.ageElapsed(elapsed);
        }

        ageAt(targetType, startType = Event.T_BEGIN) {
            var elapsed = this.eventElapsed(targetType, startType);
            return typeof elapsed === 'number' ?  this.ageElapsed(elapsed) : elapsed;
        }

        toJSON() {
            return this;
        }

    } //// class Asset

    module.exports = exports.Asset = Asset;
})(typeof exports === "object" ? exports : (exports = {}));

