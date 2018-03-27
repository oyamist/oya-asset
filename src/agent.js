(function(exports) {
    const SerializedKeyPair = require('./serialized-key-pair');
    const Transaction = require('./transaction');

    class Agent {
        constructor(opts={}) {
            this.keyPair = opts.keyPair || new SerializedKeyPair(opts);
        }

        get publicKey() {
            return this.keyPair.publicKey.key;
        }

        validateValue(value) {
            // subclasses can throw an Error.
            return true; 
        }

        createTransaction(recipient, value) {
            this.validateValue(value);

            var trans = new Transaction({
                sender_key: this.keyPair.publicKey.key,
                sender: this.keyPair.publicKey.id,
                recipient,
                value,
            });
            trans.sign(this.keyPair);
        }
    } // class Agent

    module.exports = exports.Agent = Agent;
})(typeof exports === "object" ? exports : (exports = {}));

