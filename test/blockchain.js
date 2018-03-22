(typeof describe === 'function') && describe("Block", function() {
    const winston = require('winston');
    const should = require("should");
    const fs = require('fs');
    const path = require('path');
    const {
        Blockchain,
    } = require("../index");

    it("TESTTESTBlock(data,t) creates a block", function() {
        var t = new Date(Date.UTC(2018,2,10));
        var blk = new Blockchain.Block({
            color: 'red',
        },t);
        var json = JSON.parse(JSON.stringify(blk));
        should.deepEqual(json, {
            data: {
                color: 'red',
            },
            hash: "dc58a5a539565e23548d1544f3bc8693",
            index: 0,
            nonce: 0,
            prevHash: "0",
            t: t.toJSON(),
        });

        should.throws(() => {
            var blk = new Blockchain.Block("asdf", "baddate");
        });
    });
    it("TESTTESThashBlock(blk) returns block hash", function() {
        var t = new Date(Date.UTC(2018,2,10));
        var blk = new Blockchain.Block({
            color: 'red',
        },t);
        should(blk.hash).equal(blk.hashBlock());
        should(blk.hash).equal(blk.hashBlock(blk));
        should(blk.hash).equal(blk.hashBlock({
            index:blk.index,
            t,
            prevHash: blk.prevHash,
            data:blk.data,
        }));
    });
    it("TESTTESTBlockchain() creates a blockchain", function() {
        var t = new Date(Date.UTC(2018,2,10));
        var bc = new Blockchain({
            genesis: "fluffy bunnies", // genesis block text
            t, // genesis block timestamp
        });
        should(bc.chain).instanceOf(Array);
        should(bc.chain.length).equal(1);
        should.deepEqual(bc.chain[0], bc.createGenesis());
        should.deepEqual(bc.chain[0], bc.createGenesis("fluffy bunnies"));
    });
    it("TESTTESTvalidate() validates blockchain", function() {
        var t = new Date(Date.UTC(2018,2,10));
        var bc = new Blockchain({
            genesis: "fluffy bunnies", // genesis block text
            t, // genesis block timestamp
        });
        should(bc.validate()).equal(true);
        var blk1 = new Blockchain.Block({
            color: 'red',
        },t);
        bc.addBlock(blk1);
        should(bc.validate()).equal(true);
        var blk2 = new Blockchain.Block({
            color: 'red',
        },t);
        bc.addBlock(blk2);

        should(bc.validate()).equal(true);
        blk1.index++;
        should.throws(() => bc.validate());
        blk1.index--;
        should(bc.validate()).equal(true);

        var hash = blk2.hash;
        blk2.hash += "x";
        should.throws(() => bc.validate());
        blk2.hash = hash;
        should(bc.validate()).equal(true);

        var prevHash = blk2.prevHash;
        blk2.prevHash += "x";
        should.throws(() => bc.validate());
        blk2.prevHash = prevHash;
        should(bc.validate()).equal(true);

        should(bc.chain.length).equal(3);
        should.deepEqual(bc.chain[0], bc.createGenesis());
        should.deepEqual(bc.chain[1], blk1);
        should.deepEqual(bc.chain[2], blk2);
    });
    it("TESTTESTaddBlock(newBlk) adds new block", function() {
        var t = new Date(Date.UTC(2018,2,10));
        var bc = new Blockchain({
            genesis: "fluffy bunnies", // genesis block text
            t, // genesis block timestamp
        });
        should(bc.validate()).equal(true);
        var blk1 = {
            data: {
                color: 'red',
            },
            t,
        };
        bc.addBlock(blk1); // new blocks don't need to be Block instances
        should(bc.validate()).equal(true);
        should(bc.latestBlock().t).equal(t);
        should(bc.latestBlock().data.color).equal('red');

        // bad index
        var blk2 = new Blockchain.Block({
            color: 'blue',
        },t, 5);
        should(bc.chain.length).equal(2);
        should.throws(() => {
            bc.addBlock(blk2);
        });
        should(bc.validate()).equal(true);
        should(bc.chain.length).equal(2);

        // bad prevHash
        var blk2 = new Blockchain.Block({
            color: 'blue',
        },t, 0, "badPrevHash");
        should(bc.chain.length).equal(2);
        should.throws(() => {
            bc.addBlock(blk2);
        });
        should(bc.validate()).equal(true);
        should(bc.chain.length).equal(2);

        // bad hash
        var blk2 = new Blockchain.Block({
            color: 'blue',
        },t);
        blk2.hash = "bogus";
        should(bc.chain.length).equal(2);
        should.throws(() => {
            bc.addBlock(blk2);
        });
        should(bc.validate()).equal(true);
        should(bc.chain.length).equal(2);
    });
})
