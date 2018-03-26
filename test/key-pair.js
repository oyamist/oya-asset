(typeof describe === 'function') && describe("KeyPair", function() {
    const winston = require('winston');
    const should = require("should");
    const path = require('path');
    const fs = require('fs');
    const {
        KeyPair,
    } = require("../index");
    winston.level = 'warn';

    it("KeyPair(opts) creates an identiy for computer", function() {
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

})
