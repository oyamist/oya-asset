(function(exports) {
    const uuidv4 = require("uuid/v4");
    const AssetDefs = require('./asset-defs');

    class Event {
        constructor(opts={}) {
            this.update(opts);
        }

        update(opts={}) {
            this.t = opts.t || this.t || new Date();
            if (opts.hasOwnProperty('type')) {
                if (AssetDefs.eventTypes().indexOf(opts.type) < 0) {
                    throw new Error(`Invalid type:${opts.type}`);
                }
                this.type = opts.type;
            } else {
                this.type = this.type || AssetDefs.EVENT_BEGIN;
            }
        }
    }

    module.exports = exports.Event = Event;
})(typeof exports === "object" ? exports : (exports = {}));

