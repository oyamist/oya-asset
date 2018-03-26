(function(exports) {
    const {
        MerkleJson,
    } = require("merkle-json");
    const KeyPair = require('./key-pair');
    const mj = new MerkleJson();
    const Transaction = require('./transaction');
    const DIFFICULTY = 2; // hashBlock computes in << 100ms on Pixelbook

    class AbstractBlock {
        constructor(data, t=new Date(), index=0, prevHash="0") {
            if (!(t instanceof Date)) {
                t = new Date(t);
            }
            if (isNaN(t.getTime())) {
                throw new Error("Blockchain.AbstractBlock() invalid date");
            }
            this.data = data;
            this.t = t;
            this.index = index;
            this.prevHash = prevHash;
            this.nonce = 0;
            this.type = "AbstractBlock";

            // Hash all preceding fields
            this.hash = this.hashBlock();
        }
        
        static fromJSON(obj={}, blockClass=this) {
            if (obj.type === 'AbstractBlock') {
                var block = new AbstractBlock(obj.data, obj.t, obj.index, obj.prevHash);
            } else if (obj.type === 'Block') {
                var block = new Block(obj.data, obj.t, obj.index, obj.prevHash);
            } else {
                var block = new blockClass(obj.data, obj.t, obj.index, obj.prevHash);
            }
            block.nonce = obj.nonce || block.nonce;
            block.hash = obj.hash || block.hash;
                
            return block;
        }

        static get MAX_NONCE() { return 1000; }
        static get DIFFICULTY() { return DIFFICULTY; } 

        static target(difficulty=DIFFICULTY) {
            return "".padStart(difficulty, '0');
        }

        addTransaction(trans) {
            if (!(trans instanceof Transaction)) {
                throw new Error(`AbstractBlock.addTransaction() expected:Transaction actual:${trans}`);
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
            return mj.hash(json);
        }

        mineBlock(difficulty=DIFFICULTY) {
            var target = AbstractBlock.target(difficulty);
            do {
                this.nonce++;
                this.hash = this.hashBlock();
            } while(this.hash.substr(0,difficulty) !== target);
            return this; // block is mined
        }

        unlink() {
            this.prevHash = '0'; 
            this.index = 0; 
            delete this.hash; 
            return this;
        }
    }

    class Block extends AbstractBlock {
        constructor(transactions, t, index, prevHash) {
            super(transactions = [], t, index, prevHash);
            this.type = 'Block';
        }

        static get DIFFICULTY() { return DIFFICULTY; } 
        static get AbstractBlock() { return AbstractBlock; }
    }

    module.exports = exports.Block = Block;
})(typeof exports === "object" ? exports : (exports = {}));

