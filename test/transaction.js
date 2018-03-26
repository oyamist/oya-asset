(typeof describe === 'function') && describe("Transaction", function() {
    const winston = require('winston');
    const should = require("should");
    const path = require('path');
    const fs = require('fs');
    const {
        SerializedKeyPair,
        Transaction,
    } = require("../index");

    it("TESTTESTTransaction(opts) creates transaction", function() {
        // default constructor
        var trans = new Transaction();
        var keyPair = new SerializedKeyPair();
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
    it("TESTTESTtwo equivalent objects generate different JSON strings", function() {
        var obj1 = {
            a: 1,
            b: 2,
            c: 3,
            d: 4,
            e: 5,
            f: 6,
            g: 7,
        };
        var obj2 = {
            e: 5,
            b: 2,
            a: 1,
            c: 3,
            d: 4,
            g: 7,
            f: 6,
        };
        var json1 = JSON.stringify(obj1);
        var json2 = JSON.stringify(obj2);
        should.deepEqual(obj1, obj2);
        should(json1).not.equal(json2);
    });

})
