(function(exports) {
    const SerializedKeyPair = require('./serialized-key-pair');
    const mj = new MerkleJson();
    const Transaction = require('./transaction');

    class Agent {
        constructor(opts={});
        this.keyPair = new SerializedKeyPair(opts);
    }

    validateValue(value) {
        // subclasses can throw an Error.
        return true; 
    }

    createTransaction(recipient, value) {
        this.validateValue(value);
        var inputs = "TBD";

        var trans = new Transaction({
            sender_key: this.keyPair.publicKey.key,
            sender: this.keyPair.publicKey.id,
            recipient,
            value,
            inputs,
        });
        trans.sign(this.keyPair);
    }
    /*
	public Transaction sendFunds(PublicKey _recipient,float value ) {
		if(getBalance() < value) {
			System.out.println("#Not Enough funds to send transaction. Transaction Discarded.");
			return null;
		}
		ArrayList<TransactionInput> inputs = new ArrayList<TransactionInput>();
		
		float total = 0;
		for (Map.Entry<String, TransactionOutput> item: UTXOs.entrySet()){
			TransactionOutput UTXO = item.getValue();
			total += UTXO.value;
			inputs.add(new TransactionInput(UTXO.id));
			if(total > value) break;
		}
		
		Transaction newTransaction = new Transaction(publicKey, _recipient , value, inputs);
		newTransaction.generateSignature(privateKey);
		
		for(TransactionInput input: inputs){
			UTXOs.remove(input.transactionOutputId);
		}
		
		return newTransaction;
	}
    */
	

    module.exports = exports.Agent = Agent;
})(typeof exports === "object" ? exports : (exports = {}));

