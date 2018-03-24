(typeof describe === 'function') && describe("Transaction", function() {
    const winston = require('winston');
    const should = require("should");
    const path = require('path');
    const fs = require('fs');
    const {
        Identity,
        Transaction,
    } = require("../index");

    it("TESTTESTIdentity(opts) creates an identiy for computer", function() {
        var trans = new Transaction();
        var identity = new Identity();
        should(trans.recipient).equal(identity.publicKey.id);
        should(trans.sender).equal(identity.publicKey.id);
        
        console.log(trans);
    });

})
