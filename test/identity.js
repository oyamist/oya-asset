(typeof describe === 'function') && describe("Identity", function() {
    const winston = require('winston');
    const should = require("should");
    const path = require('path');
    const fs = require('fs');
    const {
        Identity,
    } = require("../index");

    it("TESTTESTIdentity(opts) creates an identiy for computer", function() {
        var local = path.join(__dirname, '..', 'local');
        var rsaKeyPath = path.join(local, 'rsaKey.json');
        var savePath = rsaKeyPath + '.save';
        if (fs.existsSync(rsaKeyPath)) {
            console.log('saving ', rsaKeyPath);
            should(fs.existsSync(savePath)).equal(false);
            fs.renameSync(rsaKeyPath, savePath);
        } else {
            console.log('no ', rsaKeyPath);
        }
        var level = winston.level;
        winston.level = 'info';
        var identity = new Identity();
        winston.level = level;
        should(typeof identity.publicKey.key).equal('string');
        should(typeof identity.publicKey.id).equal('string');
        should(identity.publicKey.id.length).equal(32);

        if (fs.existsSync(savePath)) {
            if (fs.existsSync(rsaKeyPath)) {
                fs.unlinkSync(rsaKeyPath);
            }
            console.log('restoring ', rsaKeyPath);
            fs.renameSync(savePath, rsaKeyPath);
        }
        
    });

})
