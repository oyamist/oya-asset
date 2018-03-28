(function(exports) {
    const {
        MerkleJson,
    } = require("merkle-json");

    const Block = require('./block');
    const AbstractBlock = Block.AbstractBlock;
    const Transaction = require('./transaction');

    var mj = new MerkleJson();

    class Blockchain{
        constructor(opts={}) {
            this.genesis = opts.genesis || "Genesis block";
            this.t = opts.t || new Date(0); // genesis blocks are same by default
            this.difficulty = opts.difficulty == null ? AbstractBlock.DIFFICULTY : opts.difficulty;
            this.chain = [this.createGenesis(this.genesis)];
            this.resolveConflict = opts.resolveConflict || Blockchain.resolveDiscard;
            this.UTXOs = {};
        }

        static resolveDiscard(conflict) {
            // discard conflicting blocks
        }
        static resolveAppend(conflict) {
            conflict.forEach(blk => this.addBlock(blk.unlink()));
        }

        createGenesis(genesis=this.genesis) {
            return new AbstractBlock(genesis,this.t);
        }

        getBlock(index = -1) {
            return index > 0 
                ? this.chain[index] 
                : this.chain[this.chain.length + index];
        }

        postTransaction(trans) {
            trans.verifySignature();
            trans.processTransaction();
            trans.outputs.forEach(utxo => (this.UTXOs[utxo.id] = utxo));
        }

        findUTXOs(recipient, dstAccount) {
            var ids = Object.keys(this.UTXOs);
            return ids.reduce((acc, id) => {
                var utxo = this.UTXOs[id];
                var recMatch = utxo == null || utxo.recipient === recipient;
                var dstMatch = dstAccount == null || dstAccount === utxo.dstAccount;
                if (recMatch && dstMatch) {
                    acc.push(utxo);
                }
                return acc;
            }, []);
        }

        addBlock(newBlk){
            if (newBlk == null) {
                throw new Error(`Blockchain.addBlock() expected a block`);
            }
            if (!(newBlk instanceof AbstractBlock)) {
                var prototype = Object.getPrototypeOf(newBlk);
                var ctorName = prototype && prototype.constructor && prototype.constructor.name || null;
                throw new Error(`Blockchain.addBlock() expected:AbstractBlock actual:${ctorName}`);
            }
            var lastBlk = this.getBlock(-1);
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
            newBlk.mineBlock(this.difficulty);
            this.chain.push(newBlk);
            return this.getBlock(-1);
        }

        merge(src) {
            this.validate(src);
            var iSame = Math.min(this.chain.length, src.chain.length)-1;
            var conflicts = [];
            var conflictChain = this.chain.length > src.chain.length ? src.chain : this.chain;
            while (iSame>=0 && src.chain[iSame].hash !== this.chain[iSame].hash) {
                conflicts.unshift(conflictChain[iSame]);
                iSame--;
            }
            if (this.chain.length <= src.chain.length) {
                this.chain = this.chain.slice(0, iSame+1).concat(src.chain.slice(iSame+1));
            }

            this.resolveConflict(conflicts);
            return conflicts;
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

