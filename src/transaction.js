(function(exports) {
    const {
        MerkleJson,
    } = require("merkle-json");
    const SerializedKeyPair = require('./serialized-key-pair');
    const mj = new MerkleJson();

    class Output {
        constructor(){
        }
    } // class Output

    class Input {
        constructor(transactionOutputId) {
            this.transactionOutputId = transactionOutputId;
            this.UTXO = null;
        }

        setUTXO(transaction = null) {
            this.UTXO = transaction;
        }
    } // class Input

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

