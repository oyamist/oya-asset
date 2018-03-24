(typeof describe === 'function') && describe("Asset", function() {
    const winston = require('winston');
    const should = require("should");
    const jsrsasign = require('jsrsasign');
    const cryptico = require('cryptico');
    const {
        Asset,
        Plant,
        AssetDefs,
        TValue,
    } = require("../index");

    it("cryptico usage", function() {
        var mattRsaKey = cryptico.generateRSAKey("Matt's passphrase", 1024); // encryptor
        var mattPublicKey = cryptico.publicKeyString(mattRsaKey);
        var samRsaKey = cryptico.generateRSAKey("Sam's passphrase", 1024); // signer
        var samPublicKey = cryptico.publicKeyString(samRsaKey);
        //console.log('samPublicKey', samPublicKey, cryptico.publicKeyID(samPublicKey));

        var msg = "Sam signed this message";
        var encrypted = cryptico.encrypt(msg, mattPublicKey, samRsaKey);
        //console.log(encrypted.cipher);
        var decrypted = cryptico.decrypt(encrypted.cipher, mattRsaKey);      
        should(decrypted.publicKeyString).equal(samPublicKey);
        //console.log(decrypted);
        var signer = cryptico.publicKeyID(decrypted.publicKeyString);
        should(signer).equal(cryptico.publicKeyID(samPublicKey));
    });

})
