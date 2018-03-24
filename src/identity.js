(function(exports) {
    const uuidv4 = require("uuid/v4");
    const cryptico = require('cryptico');
    const winston = require('winston');
    const path = require('path');
    const fs = require('fs');
    const os = require('os');
    
    class Identity {
        constructor(opts={}) {
            var local = path.join(__dirname, '..', 'local');
            if (!fs.existsSync(local)) {
                fs.mkdirSync(local);
            }
            this.rsaKeyPath = opts.rsaKeyPath || path.join(local,'rsaKey.json');
            if (fs.existsSync(this.rsaKeyPath)) {
                this.rsaKey = JSON.parse(fs.readFileSync(this.rsaKeyPath));
            } else {
                var interfaces = os.networkInterfaces();
                var passPhrase = Object.keys(interfaces).reduce((acc,key) => {
                    var ifctype  = interfaces[key];
                    acc =  ifctype.reduce((ai,ifc) => 
                        (ai + ifc.mac), acc);
                    return acc;
                }, `${Math.random(Date.now())}`);

                winston.info("Identity() created RSA key: ${this.rsaKeyPath}");
                this.rsaKey = cryptico.generateRSAKey(passPhrase, 1024); // encryptor
                fs.writeFileSync(this.rsaKeyPath, JSON.stringify(this.rsaKey, undefined, 2));
            }
            this.publicKey = {
                key: cryptico.publicKeyString(this.rsaKey),
            };
            this.publicKey.id = cryptico.publicKeyID(this.publicKey.key);
            winston.info(`Identity() public key:${this.publicKey.key}`);
            winston.info(`Identity() public key id:${this.publicKey.id}`);
        }
    } //// class Identity

    module.exports = exports.Identity = Identity;
})(typeof exports === "object" ? exports : (exports = {}));

