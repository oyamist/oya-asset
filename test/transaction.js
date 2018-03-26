(typeof describe === 'function') && describe("Transaction", function() {
    const winston = require('winston');
    const should = require("should");
    const path = require('path');
    const fs = require('fs');
    const {
        KeyPair,
        Transaction,
    } = require("../index");

    it("TESTTESTTransaction(opts) creates transaction", function() {
        // default constructor
        var trans = new Transaction();
        var keyPair = new KeyPair();
        should(trans.recipient).equal(keyPair.publicKey.id);
        should(trans.sender).equal(keyPair.publicKey.id);
        should(Transaction.Output).instanceOf(Function);
        should(Transaction.Input).instanceOf(Function);


        should.throws(() => {
            new Transaction({
                t: 'bad date',
            });
        });
    });
    it("TESTTESTtransactions are serializable", function() {
        // unprocess transactions are serializable
        var trans = new Transaction({
            sender: 'Bob',
            recipient: 'Alice',
            t: new Date(2018,1,12),
            value: 'A tomato',
        });
        var json = JSON.parse(JSON.stringify(trans));
        var trans2 = new Transaction(json);
        should.deepEqual(trans2, trans);
        should.deepEqual(json, {
            sender: 'Bob',
            recipient: 'Alice',
            t: new Date(2018,1,12).toJSON(),
            value: 'A tomato',
        });

        // processed transactions are serializable
        trans.processTransaction();
        var json = JSON.parse(JSON.stringify(trans));
        var trans2 = new Transaction(json);
        should.deepEqual(trans2, trans);
    });

})
