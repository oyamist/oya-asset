(typeof describe === 'function') && describe("KeyPair", function() {
    const winston = require('winston');
    const should = require("should");
    const path = require('path');
    const fs = require('fs');
    const {
        KeyPair,
    } = require("../index");
    winston.level = 'warn';

    it("KeyPair(opts) returns the PKI identiy for this computer", function() {
        var local = path.join(__dirname, '..', 'local');
        var rsaKeyPath = path.join(local, 'rsaKey.json');
        var savePath = rsaKeyPath + '.save';
        if (fs.existsSync(rsaKeyPath)) {
            winston.info('saving ', rsaKeyPath);
            should(fs.existsSync(savePath)).equal(false);
            fs.renameSync(rsaKeyPath, savePath);
        } else {
            winston.info('no ', rsaKeyPath);
        }
        var keyPair = new KeyPair();
        should(typeof keyPair.publicKey.key).equal('string');
        should(typeof keyPair.publicKey.id).equal('string');
        should(keyPair.publicKey.id.length).equal(32);

        if (fs.existsSync(savePath)) {
            if (fs.existsSync(rsaKeyPath)) {
                fs.unlinkSync(rsaKeyPath);
            }
            winston.info('restoring ', rsaKeyPath);
            fs.renameSync(savePath, rsaKeyPath);
        }
        
    });
    it("TESTTESTsign(plainText) returns message signature", function() {
        var keyPair = new KeyPair({
            rsaKeyPath: path.join(__dirname, "test-rsaKey.json"),
        });
        should(keyPair.publicKey.id).equal('1b7526fe48ca8e6fdb0d849c3a2f5a50');
        var msg = "A sunny day";
        should(keyPair.sign(msg).id).equal('bd529c51f3bd678131133af445235e0c');
        should(keyPair.sign(msg).signature).startWith('fd26228f76');
    });

})
