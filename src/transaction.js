(function(exports) {
    const {
        MerkleJson,
    } = require("merkle-json");
    const SerializedKeyPair = require('./serialized-key-pair');
    const mj = new MerkleJson();

    class Output {
        constructor(){
        }
    }

    class Input {
    }

    class Transaction {
        constructor(opts={}) {
            this.update(opts);
        }

        update(opts={}) {
            var keyPair = opts.keyPair || new SerializedKeyPair();
            this.sender = opts.sender || this.sender || keyPair.publicKey.id;
            this.recipient = opts.recipient || this.recipient || keyPair.publicKey.id;
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

        transactionHash(trans = this) {
            return mj.hash({
                sender: trans.sender,
                recipient: trans.recipient,
                snapshot: trans.snapshot,
                value: trans.value,
                t: trans.t,
            });
        }

        verifySignature() {
            // TBD
            return true;
        }

        processTransaction() {
            this.verifySignature();
            this.id = this.transactionHash();
            return true;
        }

        static get Output() { return Output; }
        static get Input() { return Input; }
        
/*
        public String transactionId; //Contains a hash of transaction*
        public PublicKey sender; //Senders address/public key.
        public PublicKey reciepient; //Recipients address/public key.
        public float value; //Contains the amount we wish to send to the recipient.
        public byte[] signature; //This is to prevent anybody else from spending funds in our wallet.
        
        public ArrayList<TransactionInput> inputs = new ArrayList<TransactionInput>();
        public ArrayList<TransactionOutput> outputs = new ArrayList<TransactionOutput>();
        
        private static int sequence = 0; //A rough count of how many transactions have been generated 
        
        // Constructor: 
        public Transaction(PublicKey from, PublicKey to, float value,  ArrayList<TransactionInput> inputs) {
            this.sender = from;
            this.reciepient = to;
            this.value = value;
            this.inputs = inputs;
        }
        
        public boolean processTransaction() {
            
            if(verifySignature() == false) {
                System.out.println("#Transaction Signature failed to verify");
                return false;
            }
                    
            //Gathers transaction inputs (Making sure they are unspent):
            for(TransactionInput i : inputs) {
                i.UTXO = NoobChain.UTXOs.get(i.transactionOutputId);
            }

            //Checks if transaction is valid:
            if(getInputsValue() < NoobChain.minimumTransaction) {
                System.out.println("Transaction Inputs too small: " + getInputsValue());
                System.out.println("Please enter the amount greater than " + NoobChain.minimumTransaction);
                return false;
            }
            
            //Generate transaction outputs:
            float leftOver = getInputsValue() - value; //get value of inputs then the left over change:
            transactionId = calulateHash();
            outputs.add(new TransactionOutput( this.reciepient, value,transactionId)); //send value to recipient
            outputs.add(new TransactionOutput( this.sender, leftOver,transactionId)); //send the left over 'change' back to sender		
                    
            //Add outputs to Unspent list
            for(TransactionOutput o : outputs) {
                NoobChain.UTXOs.put(o.id , o);
            }
            
            //Remove transaction inputs from UTXO lists as spent:
            for(TransactionInput i : inputs) {
                if(i.UTXO == null) continue; //if Transaction can't be found skip it 
                NoobChain.UTXOs.remove(i.UTXO.id);
            }
            
            return true;
        }
        
        public float getInputsValue() {
            float total = 0;
            for(TransactionInput i : inputs) {
                if(i.UTXO == null) continue; //if Transaction can't be found skip it, This behavior may not be optimal.
                total += i.UTXO.value;
            }
            return total;
        }
        
        public void generateSignature(PrivateKey privateKey) {
            String data = StringUtil.getStringFromKey(sender) + StringUtil.getStringFromKey(reciepient) + Float.toString(value)	;
            signature = StringUtil.applyECDSASig(privateKey,data);		
        }
        
        public boolean verifySignature() {
            String data = StringUtil.getStringFromKey(sender) + StringUtil.getStringFromKey(reciepient) + Float.toString(value)	;
            return StringUtil.verifyECDSASig(sender, data, signature);
        }
        
        public float getOutputsValue() {
            float total = 0;
            for(TransactionOutput o : outputs) {
                total += o.value;
            }
            return total;
        }
        
    }
    */
    } //// class Transaction

    module.exports = exports.Transaction = Transaction;
})(typeof exports === "object" ? exports : (exports = {}));

