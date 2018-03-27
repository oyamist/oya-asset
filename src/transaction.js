(function(exports) {
    const {
        MerkleJson,
    } = require("merkle-json");
    const SerializedKeyPair = require('./serialized-key-pair');
    const mj = new MerkleJson();

    class Transaction {
        constructor(opts={}) {
            this.update(opts);
        }

        update(opts={}) {
            opts.sender && (this.sender = opts.sender);
            if (this.sender == null) {
                var kpSelf = opts.keyPair || new SerializedKeyPair();
                this.sender = kpSelf.publicKey.id;
            }
            this.recipient = opts.recipient || this.recipient || this.sender;
            (opts.signature) && (this.signature = opts.signature);
            this.value = opts.value || this.value || {};
            (opts.id) && (this.id = opts.id);
            this.t = opts.t || new Date();
            if (!(this.t instanceof Date)) {
                this.t = new Date(this.t);
            }
            if (isNaN(this.t.getTime())) {
                throw new Error(`invalid Date:${JSON.stringify(opts.t)}`);
            }
        }

        verifySignature() {
            var plainText = this.signedData();
            if (this.signature == null) {
                throw new Error("Transaction has not been signed");
            }
            if (!SerializedKeyPair.verify(plainText, this.signature, this.sender)) {
                throw new Error("Transaction has been tampered");
            };
            if (this.id !== this.generateId()) {
                throw new Error("Transaction id has been tampered");
            }
            return true;
        }

        processTransaction() {
            this.verifySignature();
            return true;
        }

        signedData() {
            return mj.stringify({
                sender: this.sender,
                recipient: this.recipient,
                value: this.value,
                t: this.t,
            });
        }

        generateId() {
            return mj.hash({
                sender: this.sender,
                recipient: this.recipient,
                value: this.value,
                t: this.t,
                signature: this.signature,
            });
        }

        sign(keyPair) {
            var plainText = this.signedData();
            var sign = keyPair.sign(plainText);
            this.signature = sign.signature;
            this.id = this.generateId();
        }
        
    } //// class Transaction

    module.exports = exports.Transaction = Transaction;
})(typeof exports === "object" ? exports : (exports = {}));

