(function(exports) {
    const uuidv4 = require("uuid/v4");
    const AssetDefs = require('./asset-defs');
    const Asset = require('./asset');

    class Plant extends Asset {
        constructor(opts={}) {
            super(Object.assign({
                type: AssetDefs.ASSET_PLANT,
            }, opts));
        }

    }

    module.exports = exports.Plant = Plant;
})(typeof exports === "object" ? exports : (exports = {}));

