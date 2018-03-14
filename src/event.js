(function(exports) {
    const uuidv4 = require("uuid/v4");

    class Event {
        constructor(opts={}) {
            this.update(opts);
        }

        static get T_BEGIN() { return "begin"; } // singular
        static get T_GERMINATING() { return "germinating"; } // singular
        static get T_SPROUTED() { return "sprouted"; } // singular
        static get T_BUDDING() { return "budding"; } // multiple for perennials 
        static get T_FLOWERING() { return "flowering"; } // multiple for perennials
        static get T_POLLINATED() { return "pollinated"; } // multiple
        static get T_FRUITING() { return "fruiting"; } // multiple for perennials
        static get T_RIPENING() { return "ripening"; } // multiple for perennials
        static get T_HARVESTED() { return "harvested"; } // multiple
        static get T_END() { return "end"; } // singular

        static eventTypes() {
            return [
                Event.T_BEGIN,
                Event.T_GERMINATING,
                Event.T_SPROUTED,
                Event.T_BUDDING,
                Event.T_FLOWERING,
                Event.T_POLLINATED,
                Event.T_FRUITING,
                Event.T_RIPENING,
                Event.T_HARVESTED,
                Event.T_END,
            ];
        }

        update(opts={}) {
            this.t = opts.t || this.t || new Date();
            if (opts.hasOwnProperty('type')) {
                if (Event.eventTypes().indexOf(opts.type) < 0) {
                    throw new Error(`Invalid type:${opts.type}`);
                }
                this.type = opts.type;
            } else {
                this.type = this.type || Event.T_BEGIN;
            }
        }
    }

    module.exports = exports.Event = Event;
})(typeof exports === "object" ? exports : (exports = {}));

