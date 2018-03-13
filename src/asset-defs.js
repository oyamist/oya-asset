(function(exports) {
    class AssetDefs {
        static get EVENT_BEGIN() { return "begin"; } // singular
        static get EVENT_GERMINATING() { return "germinating"; } // singular
        static get EVENT_SPROUTED() { return "sprouted"; } // singular
        static get EVENT_BUDDING() { return "budding"; } // multiple for perennials 
        static get EVENT_FLOWERING() { return "flowering"; } // multiple for perennials
        static get EVENT_POLLINATED() { return "pollinated"; } // multiple
        static get EVENT_FRUITING() { return "fruiting"; } // multiple for perennials
        static get EVENT_RIPENING() { return "ripening"; } // multiple for perennials
        static get EVENT_HARVESTED() { return "harvested"; } // multiple
        static get EVENT_END() { return "end"; } // singular

        static get ASSET_ACTUATOR() { return "actuator"; }
        static get ASSET_LIGHT() { return "light"; }
        static get ASSET_MCU() { return "mcu"; }
        static get ASSET_PLANT() { return "plant"; }
        static get ASSET_PUMP() { return "pump"; }
        static get ASSET_RESERVOIR() { return "reservoir"; }
        static get ASSET_SENSOR() { return "sensor"; }
        static get ASSET_TENT() { return "tent"; }

        static eventTypes() {
            return [
                AssetDefs.EVENT_BEGIN,
                AssetDefs.EVENT_GERMINATING,
                AssetDefs.EVENT_SPROUTED,
                AssetDefs.EVENT_BUDDING,
                AssetDefs.EVENT_FLOWERING,
                AssetDefs.EVENT_POLLINATED,
                AssetDefs.EVENT_FRUITING,
                AssetDefs.EVENT_RIPENING,
                AssetDefs.EVENT_HARVESTED,
                AssetDefs.EVENT_END,
            ];
        }

        static assetTypes() {
            return [
                AssetDefs.ASSET_ACTUATOR,
                AssetDefs.ASSET_LIGHT,
                AssetDefs.ASSET_MCU,
                AssetDefs.ASSET_PLANT,
                AssetDefs.ASSET_PUMP,
                AssetDefs.ASSET_RESERVOIR,
                AssetDefs.ASSET_SENSOR,
                AssetDefs.ASSET_TENT,

            ];
        }

    }

    module.exports = exports.AssetDefs = AssetDefs;
})(typeof exports === "object" ? exports : (exports = {}));

