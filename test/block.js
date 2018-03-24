(typeof describe === 'function') && describe("Block", function() {
    const winston = require('winston');
    const should = require("should");
    const {
        Block,
    } = require("../index");

    it("Block(data,t) creates a block", function() {
        var t = new Date(Date.UTC(2018,2,10));
        var blk = new Block({
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
            var blk = new Block("asdf", "baddate");
        });
    });
    it("hashBlock(blk) returns block hash", function() {
        var t = new Date(Date.UTC(2018,2,10));
        var blk = new Block({
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
    it("mineBlock(difficulty) does work to find target hash", function() {
        var blk = new Block({
            color: 'red',
        });
        var msStart = Date.now();
        should(blk.mineBlock()).equal(blk);
        var hash = blk.hash;
        should(hash.substr(0,Block.DIFFICULTY)).equal('00');
        should(blk.mineBlock(3)).equal(blk);
        should(blk.hash.substr(0,3)).equal('000');
        should(hash.substr(0,3) === '000');
        should(Date.now()-msStart).below(100);
    });
    it("target(difficulty) returns hash target", function() {
        should(Block.target(0)).equal('');
        should(Block.target(1)).equal('0');
        should(Block.target(3)).equal('000');
    });
})
