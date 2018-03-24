(function(exports) {
    const {
        RbHash,
    } = require("rest-bundle");
    const rbHash = new RbHash();
    const Transaction = require('./transaction');

    class Block {
        constructor(data, t=new Date(), index=0, prevHash="0") {
            if (!(t instanceof Date)) {
                t = new Date(t);
            }
            if (isNaN(t.getTime())) {
                throw new Error("Blockchain.Block() invalid date");
            }
            this.data = data;
            this.t = t;
            this.index = index;
            this.prevHash = prevHash;
            this.nonce = 0;

            // Hash all preceding fields
            this.hash = this.hashBlock();
        }

        static get MAX_NONCE() { return 1000; }
        static get DIFFICULTY() { return 2; } // usually below 10ms on Pixelbook

        static target(difficulty=Block.DIFFICULTY) {
            return "".padStart(difficulty, '0');
        }

        addTransaction(trans) {
            if (!(trans instanceof Transaction)) {
                throw new Error(`Block.addTransaction() expected:Transaction actual:${trans}`);
            }
            this.prevHash === '0' && trans.processTransaction();
        }

        hashBlock(blk=this) {
            var json = JSON.stringify({
                data: blk.data,
                t: blk.t,
                index: blk.index,
                prevHash: blk.prevHash,
                nonce: blk.nonce || 0,
            });
            return rbHash.hashCached(json);
        }

        mineBlock(difficulty=Block.DIFFICULTY) {
            var target = Block.target(difficulty);
            do {
                this.nonce++;
                this.hash = this.hashBlock();
            } while(this.hash.substr(0,difficulty) !== target);
            return this; // block is mined
        }
    }

    module.exports = exports.Block = Block;
})(typeof exports === "object" ? exports : (exports = {}));

