(function(exports) {
    const uuidv4 = require("uuid/v4");
    const Asset = require('./asset');

    class Plant extends Asset {
        constructor(opts={}) {
            super(Object.assign({
                type: Asset.T_PLANT,
            }, opts));
        }

    }

    module.exports = exports.Plant = Plant;
})(typeof exports === "object" ? exports : (exports = {}));

