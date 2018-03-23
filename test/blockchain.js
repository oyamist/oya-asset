(typeof describe === 'function') && describe("Block", function() {
    const winston = require('winston');
    const should = require("should");
    const fs = require('fs');
    const path = require('path');
    const {
        Blockchain,
    } = require("../index");
    const Block = Blockchain.Block;

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
            hash: "5d0ae2426bdd62b10f93090308324a59",
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
        should(bc.getBlock(-1).t).equal(t);
        should(bc.getBlock(-1).data.color).equal('red');

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
    it("TESTTESTmerge(blkchn) merges in longer compatible blockchain", function() {
        var opts = {
            genesis: "G",
        };
        var bcA = new Blockchain(opts);
        var bcB = new Blockchain(opts);
        should(bcA.chain[0].hash).equal(bcB.chain[0].hash);
        var t1 = new Date(2018,1,1);
        var t2 = new Date(2018,1,2);

        bcA.addBlock(new Block("AB1", t1));
        should.deepEqual(bcA.chain.map(b=>b.data), ["G","AB1"]);

        bcB.addBlock(new Block("AB1", t1));
        bcB.addBlock(new Block("B2", t2));
        should.deepEqual(bcB.chain.map(b=>b.data), ["G","AB1","B2"]);

        // merge compatible blockchains
        var conflicts = bcA.merge(bcB);
        should(bcA.chain).not.equal(bcB.chain);
        should.deepEqual(bcA.chain.map(b=>b.data), ["G","AB1","B2"]);
        should.deepEqual(bcB.chain.map(b=>b.data), ["G","AB1","B2"]); // unaffected
        should(bcA.validate()).equal(true);
        should(bcB.validate()).equal(true);
        should.deepEqual(conflicts.map(b=>b.data), []);
    });
    it("TESTTESTmerge(blkchn) merges in shorter compatible blockchain", function() {
        var opts = {
            genesis: "G",
        };
        var bcA = new Blockchain(opts);
        var bcB = new Blockchain(opts);
        should(bcA.chain[0].hash).equal(bcB.chain[0].hash);
        var t1 = new Date(2018,1,1);
        var t2 = new Date(2018,1,2);

        bcA.addBlock(new Block("AB1", t1));
        bcA.addBlock(new Block("A2", t2));
        should.deepEqual(bcA.chain.map(b=>b.data), ["G","AB1","A2"]);

        bcB.addBlock(new Block("AB1", t1));
        should.deepEqual(bcB.chain.map(b=>b.data), ["G","AB1"]);

        // merge compatible blockchains
        var conflicts = bcA.merge(bcB);
        should.deepEqual(bcA.chain.map(b=>b.data), ["G","AB1","A2"]);
        should.deepEqual(bcB.chain.map(b=>b.data), ["G","AB1"]);
        should(bcA.validate()).equal(true);
        should(bcB.validate()).equal(true);
        should.deepEqual(conflicts.map(b=>b.data), []);
    });
    it("TESTTESTmerge(blkchn) resolves longer conflicting blockchain with discard", function() {
        var opts = {
            genesis: "G",
        };
        var bcA = new Blockchain(opts);
        should(bcA.resolveConflict).equal(Blockchain.resolveDiscard); // discard by default
        var bcB = new Blockchain(opts);
        var t1 = new Date(2018,1,1);
        var t2 = new Date(2018,1,2);
        var t3 = new Date(2018,1,3);
        var t4 = new Date(2018,1,4);

        bcA.addBlock(new Block("AB1", t1));
        bcA.addBlock(new Block("A2", t2));
        bcA.addBlock(new Block("A3", t3));
        should.deepEqual(bcA.chain.map(b=>b.data), ["G","AB1","A2","A3"]);

        bcB.addBlock(new Block("AB1", t1));
        bcB.addBlock(new Block("B2", t2));
        bcB.addBlock(new Block("B3", t3));
        bcB.addBlock(new Block("B4", t4));
        should.deepEqual(bcB.chain.map(b=>b.data), ["G","AB1","B2","B3","B4"]);

        // discard [A2,A3] by default
        var conflicts = bcA.merge(bcB);
        should.deepEqual(bcA.chain.map(b=>b.data), ["G","AB1","B2","B3","B4"]);
        should.deepEqual(bcB.chain.map(b=>b.data), ["G","AB1","B2","B3","B4"]);
        should.deepEqual(conflicts.map(b=>b.data), ["A2","A3"]);
    });
    it("TESTTESTmerge(blkchn) resolves shorter conflicting blockchain with discard", function() {
        var opts = {
            genesis: "G",
            resolveConflict: Blockchain.resolveDiscard,
        };
        var bcA = new Blockchain(opts);
        should(bcA.resolveConflict).equal(Blockchain.resolveDiscard); // discard by default
        var bcB = new Blockchain(opts);
        var t1 = new Date(2018,1,1);
        var t2 = new Date(2018,1,2);
        var t3 = new Date(2018,1,3);
        bcA.addBlock(new Block("AB1", t1));
        bcA.addBlock(new Block("A2", t2));
        bcA.addBlock(new Block("A3", t3));
        should.deepEqual(bcA.chain.map(b=>b.data), ["G","AB1","A2","A3"]);

        bcB.addBlock(new Block("AB1", t1));
        bcB.addBlock(new Block("B2", t2));
        should.deepEqual(bcB.chain.map(b=>b.data), ["G","AB1","B2"]);

        // discard conflict [B2] by default
        var conflicts = bcA.merge(bcB);
        should.deepEqual(bcA.chain.map(b=>b.data), ["G","AB1","A2","A3"]);
        should.deepEqual(bcB.chain.map(b=>b.data), ["G","AB1","B2"]);
        should.deepEqual(conflicts.map(b=>b.data), ["B2"]);
    });
    it("TESTTESTmerge(blkchn) resolves longer conflicting blockchain with append", function() {
        var opts = {
            genesis: "G",
            resolveConflict: Blockchain.resolveAppend,
        };
        var bcA = new Blockchain(opts);
        var bcB = new Blockchain(opts);
        var t1 = new Date(2018,1,1);
        var t2 = new Date(2018,1,2);
        var t3 = new Date(2018,1,3);
        var t4 = new Date(2018,1,4);
        bcA.addBlock(new Block("AB1", t1));
        bcA.addBlock(new Block("A2", t2));
        bcA.addBlock(new Block("A3", t3));
        should.deepEqual(bcA.chain.map(b=>b.data), ["G","AB1","A2","A3"]);

        bcB.addBlock(new Block("AB1", t1));
        bcB.addBlock(new Block("B2", t2));
        bcB.addBlock(new Block("B3", t3));
        bcB.addBlock(new Block("B4", t4));
        should.deepEqual(bcB.chain.map(b=>b.data), ["G","AB1","B2","B3","B4"]);

        // append conflict [A2,A3] 
        var conflicts = bcA.merge(bcB);
        should.deepEqual(bcA.chain.map(b=>b.data), ["G","AB1","B2","B3","B4","A2","A3"]);
        should.deepEqual(bcB.chain.map(b=>b.data), ["G","AB1","B2","B3","B4"]);
        should.deepEqual(conflicts.map(b=>b.data), ["A2","A3"]);
    });
    it("TESTTESTmerge(blkchn) resolves shorter conflicting blockchain with append", function() {
        var opts = {
            genesis: "G",
            resolveConflict: Blockchain.resolveAppend,
        };
        var bcA = new Blockchain(opts);
        var bcB = new Blockchain(opts);
        var t1 = new Date(2018,1,1);
        var t2 = new Date(2018,1,2);
        var t3 = new Date(2018,1,3);
        var t4 = new Date(2018,1,4);
        bcA.addBlock(new Block("AB1", t1));
        bcA.addBlock(new Block("A2", t2));
        bcA.addBlock(new Block("A3", t3));
        bcA.addBlock(new Block("A4", t4));
        should.deepEqual(bcA.chain.map(b=>b.data), ["G","AB1","A2","A3","A4"]);

        bcB.addBlock(new Block("AB1", t1));
        bcB.addBlock(new Block("B2", t2));
        bcB.addBlock(new Block("B3", t3));
        should.deepEqual(bcB.chain.map(b=>b.data), ["G","AB1","B2","B3"]);

        // append conflict [B2,B3] 
        var conflicts = bcA.merge(bcB);
        should.deepEqual(bcA.chain.map(b=>b.data), ["G","AB1","A2","A3","A4","B2","B3"]);
        should.deepEqual(bcB.chain.map(b=>b.data), ["G","AB1","B2","B3"]);
        should.deepEqual(conflicts.map(b=>b.data), ["B2","B3"]);
    });
})
