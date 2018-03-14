(function(exports) {
    const uuidv4 = require("uuid/v4");

    class Event {
        constructor(opts={}) {
            this.update(opts);
        }

        static get E_BEGIN() { return "begin"; } // singular
        static get E_GERMINATING() { return "germinating"; } // singular
        static get E_SPROUTED() { return "sprouted"; } // singular
        static get E_BUDDING() { return "budding"; } // multiple for perennials 
        static get E_FLOWERING() { return "flowering"; } // multiple for perennials
        static get E_POLLINATED() { return "pollinated"; } // multiple
        static get E_FRUITING() { return "fruiting"; } // multiple for perennials
        static get E_RIPENING() { return "ripening"; } // multiple for perennials
        static get E_HARVESTED() { return "harvested"; } // multiple
        static get E_END() { return "end"; } // singular

        static eventTypes() {
            return [
                Event.E_BEGIN,
                Event.E_GERMINATING,
                Event.E_SPROUTED,
                Event.E_BUDDING,
                Event.E_FLOWERING,
                Event.E_POLLINATED,
                Event.E_FRUITING,
                Event.E_RIPENING,
                Event.E_HARVESTED,
                Event.E_END,
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
                this.type = this.type || Event.E_BEGIN;
            }
        }
    }

    module.exports = exports.Event = Event;
})(typeof exports === "object" ? exports : (exports = {}));

