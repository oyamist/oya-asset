(function(exports) {
    const {
        RbHash,
    } = require("rest-bundle");

    var rbHash = new RbHash();

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

            // Hash all preceding fields
            this.hash = this.hashBlock();
            this.nonce = 0;
        }

        hashBlock(blk=this) {
            var json = JSON.stringify({
                data: blk.data,
                t: blk.t,
                index: blk.index,
                prevHash: blk.prevHash,
            });
            return rbHash.hashCached(json);
        }
    }

    class Blockchain{
        constructor(opts={}) {
            this.genesis = opts.genesis || "Genesis block";
            this.t = opts.t || new Date(0); // genesis blocks are same by default
            this.chain = [this.createGenesis(this.genesis)];
            this.resolveConflict = opts.resolveConflict || Blockchain.resolveDiscard;
        }

        static get Block() { return Block; }
        static resolveDiscard(conflict) {
            // discard conflicting blocks
        }
        static resolveAppend(conflict) {
            conflict.forEach(blk => {
                this.addBlock({
                    data: blk.data, 
                    t: blk.t,
                });
            });
        }

        createGenesis(genesis=this.genesis) {
            return new Block(genesis,this.t);
        }

        latestBlock() {
            return this.chain[this.chain.length - 1]
        }

        addBlock(newBlk){
            if (!(newBlk instanceof Block)) {
                newBlk = new Block(newBlk.data, newBlk.t);
            }
            var lastBlk = this.latestBlock();
            if (newBlk.prevHash && newBlk.prevHash !== "0" && newBlk.prevHash !== lastBlk.hash) {
                throw new Error(`Blockchain.addBlock() new block `+
                    `prevhash:${newBlk.prevHash} expected:${lastBlk.hash}`);
            }
            if (newBlk.index && newBlk.index !== lastBlk.index+1) {
                throw new Error(`Blockchain.addBlock() new block `+
                    `index:${newBlk.index} expected:${lastBlk.index+1}`);
            }
            var hash = lastBlk.hashBlock(newBlk);
            if (newBlk.hash && newBlk.hash !== hash) {
                throw new Error(`Blockchain.addBlock() new block `+
                    `hash:${newBlk.hash} expected:${hash}`);
            }

            newBlk.prevHash = lastBlk.hash;
            newBlk.index = lastBlk.index+1;
            newBlk.hash = lastBlk.hashBlock(newBlk);
            this.chain.push(newBlk);
            return this.latestBlock();
        }

        merge(src) {
            this.validate(src);
            var iSame = Math.min(this.chain.length, src.chain.length)-1;
            var conflict = [];
            var conflictChain = this.chain.length > src.chain.length ? src.chain : this.chain;
            while (iSame>=0 && src.chain[iSame].hash !== this.chain[iSame].hash) {
                conflict.unshift(conflictChain[iSame]);
                iSame--;
            }
            if (this.chain.length <= src.chain.length) {
                this.chain = this.chain.slice(0, iSame+1).concat(src.chain.slice(iSame+1));
            }

            this.resolveConflict(conflict);
        }

        validate(src=this) {
            for (var i = 1; i < src.chain.length; i++) {
                const curBlk = src.chain[i];
                const prevBlk = src.chain[i - 1];

                if (curBlk.hash !== curBlk.hashBlock()) {
                    throw new Error(`Blockchain.validate() hash expected:${curBlk.hashBlock()} actual:${curBlk.hash}`);
                }

                if (curBlk.prevHash !== prevBlk.hash) {
                    throw new Error(`Blockchain.validate() prevHash expected:${curBlk.prevHash} actual:${prevBlk.hash}`);
                }

                if (curBlk.index !== prevBlk.index+1) {
                    throw new Error(`Blockchain.validate() index expected:${prevBlk.index+1} actual:${curBlk.index}`);
                }
            }

            return true;
        }
    }

    module.exports = exports.Blockchain = Blockchain;
})(typeof exports === "object" ? exports : (exports = {}));

