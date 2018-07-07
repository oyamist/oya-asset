(function(exports) {
    const Asset = require('./asset');
    const TValue = require('./tvalue');

    class Plant extends Asset {
        constructor(opts={}) {
            super(Object.assign({
                type: Asset.T_PLANT,
            }, opts));
            
            if (opts.hasOwnProperty(Plant.T_PLANT)) {
                this.setTValue(Plant.T_PLANT, opts.plant, TValue.RETROACTIVE);
            }
            if (opts.hasOwnProperty(Plant.T_CULTIVAR)) {
                this.setTValue(Plant.T_CULTIVAR, opts.cultivar, TValue.RETROACTIVE);
            }
        }

        static get T_CULTIVAR() { return "cultivar"; } // singular
        static get T_PLANT() { return "plant"; } // singular
        static get T_GERMINATING() { return "germinating"; } // singular
        static get T_SPROUTED() { return "sprouted"; } // singular
        static get T_BUDDING() { return "budding"; } // multiple for perennials 
        static get T_FLOWERING() { return "flowering"; } // multiple for perennials
        static get T_POLLINATED() { return "pollinated"; } // multiple
        static get T_FRUITING() { return "fruiting"; } // multiple for perennials
        static get T_RIPENING() { return "ripening"; } // multiple for perennials
        static get T_HARVESTED() { return "harvested"; } // multiple

        static get P_TOMATO() { return "tomato"; }
        static get C_CHOCOLATE_STRIPES() { return "chocolate_stripes"; }

        static valueTags() {
            return [
                TValue.T_BUDDING,
                TValue.T_CULTIVAR,
                TValue.T_FLOWERING,
                TValue.T_FRUITING,
                TValue.T_GERMINATING,
                TValue.T_HARVESTED,
                TValue.T_PLANT,
                TValue.T_POLLINATED,
                TValue.T_RIPENING,
                TValue.T_SPROUTED,

            ];
        }

        namePrefix(opts={}) {
            var plant = opts.plant || this.type;
            var cultivar = opts.cultivar && `${opts.cultivar} ` || '';
            return `${cultivar}${plant}_`;
        }

        get plant() {
            return this.get(Plant.T_PLANT);
        }
        set plant(value) {
            this.setTValue(Plant.T_PLANT, value);
        }

        get cultivar() {
            return this.get(Plant.T_CULTIVAR);
        }
        set cultivar(value) {
            this.setTValue(Plant.T_CULTIVAR, value);
        }

    }

    module.exports = exports.Plant = Plant;
})(typeof exports === "object" ? exports : (exports = {}));

