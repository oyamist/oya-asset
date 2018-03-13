(function(exports) {
    const uuidv4 = require("uuid/v4");
    const AssetDefs = require('./asset-defs');
    const Event = require('./event');
    const MSDAYS = 24*3600*1000;

    class Asset {
        constructor(opts = {}) {
            Object.defineProperty(this, "_name", {
                writable: true,
            });
            Object.defineProperty(this, "name", {
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

        update(opts={}) {
            if (opts.hasOwnProperty('type')) {
                if (AssetDefs.assetTypes().indexOf(opts.type) < 0) {
                    throw new Error(`Invalid type:${opts.type}`);
                }
                this.type = opts.type;
            } else {
                this.type = this.type || AssetDefs.ASSET_PLANT;
            }
            this.id = opts.id || this.id;
            this.guid = opts.guid || this.guid || uuidv4();
            this.events = opts.events || this.events || [];
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

        firstEvent(eventType = AssetDefs.EVENT_BEGIN) {
            return this.events.reduce((acc,evt) => 
                (acc || evt.type === eventType && evt || acc), null);
        }

        eventElapsed(targetType, startType = AssetDefs.EVENT_BEGIN) {
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
            var eStart = this.firstEvent(AssetDefs.EVENT_BEGIN);
            if (eStart == null) {
                throw new Error(`${this.name} has no event:${startType}`);
            }
            var eEnd = this.firstEvent(AssetDefs.EVENT_END);
            if (eEnd) {
                var elapsed = eEnd.t - eStart.t;
            } else {
                var elapsed = Date.now() - eStart.t;
            }
            return this.ageElapsed(elapsed);
        }

        ageAt(targetType, startType = AssetDefs.EVENT_BEGIN) {
            var elapsed = this.eventElapsed(targetType, startType);
            return typeof elapsed === 'number' ?  this.ageElapsed(elapsed) : elapsed;
        }

        toJSON() {
            return this;
        }

    } //// class Asset

    module.exports = exports.Asset = Asset;
})(typeof exports === "object" ? exports : (exports = {}));

