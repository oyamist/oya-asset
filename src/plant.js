(function(exports) {
    const Asset = require('./asset');

    class Plant extends Asset {
        constructor(opts={}) {
            super(Object.assign({
                type: Asset.T_PLANT,
            }, opts));
        }

        static get T_GERMINATING() { return "germinating"; } // singular
        static get T_SPROUTED() { return "sprouted"; } // singular
        static get T_BUDDING() { return "budding"; } // multiple for perennials 
        static get T_FLOWERING() { return "flowering"; } // multiple for perennials
        static get T_POLLINATED() { return "pollinated"; } // multiple
        static get T_FRUITING() { return "fruiting"; } // multiple for perennials
        static get T_RIPENING() { return "ripening"; } // multiple for perennials
        static get T_HARVESTED() { return "harvested"; } // multiple

        static valueTypes() {
            return [
                TValue.T_GERMINATING,
                TValue.T_SPROUTED,
                TValue.T_BUDDING,
                TValue.T_FLOWERING,
                TValue.T_POLLINATED,
                TValue.T_FRUITING,
                TValue.T_RIPENING,
                TValue.T_HARVESTED,
            ];
        }

    }

    module.exports = exports.Plant = Plant;
})(typeof exports === "object" ? exports : (exports = {}));

