(function(exports) {
    const uuidv4 = require("uuid/v4");
    const cryptico = require('cryptico');
    
    class Identity {
        constructor(opts={}) {
            var mattRsaKey = cryptico.generateRSAKey("Matt's passphrase", 1024); // encryptor
        }
    } //// class Identity

    module.exports = exports.Identity = Identity;
})(typeof exports === "object" ? exports : (exports = {}));

