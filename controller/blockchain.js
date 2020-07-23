var axios = require('axios');
var CryptoJS = require('crypto-js');


"use strict"; 


class Blockchain {  

  constructor(){  
    this.totalCoin = 1000000;
    this.maximumNonce = 500000;
    this.difficulty = 4; 
    this.pattern = ''; 

    for (var x=0; x < this.difficulty; x++) this.pattern += '0'; 

    // Node information 
    this.node_url = 'this_node_ip_address';
    this.node_owner_address = 'miner_public_key_address_here';
    this.node_private_key = process.env.PRIVATE_KEY;
    
    this.nodes = [];
    this.chain = [];
    this.utxos = [];
    this.mempool = [];
    this.txs = []
    this.orphans = [];
    
    this.block001(); 
  }

  async block001(){ 
    if((await this.get_chain()).length !== 0)  return false; 
    
    let data = {success: false};
    while ( !data.success )
        data = await this.proof_of_work(1, 0);   

    await this.create_block(data);
  }

  async get_chain(obj=null){ 
    const chain = this.chain;    
    return Promise.resolve(chain);
  }

  async get_chainlen(){  
    return Promise.resolve(this.chain.length); 
  }

  async get_mempool(){  
    let mempool = this.mempool;  
    return Promise.resolve({mempool, length: mempool.length});  
  }

  get_utxos(){ 
    return Promise.resolve(this.utxos);
  }

  async create_block(data){  

    const {block_index, timestamp, nonce, previous_hash, txs, miner_reward, miner_address} = data.msgObj; 
    if(block_index !==1) delete_mempool_txs_selected(txs); 
    
    let block = {  
      index: block_index, 
      timestamp: timestamp, 
      proof: nonce, 
      previous_hash: previous_hash, 
      hash: data.hash_operation, 
      transactions: txs, 
      miner: {miner_reward, miner_address} 
    } 

    // Store in ledger
    this.chain.push(block); 

    return Promise.resolve(block); 
  }       
  
  delete_mempool_selected(){
    return true;
  }

  get_prefered_mempool_txs(){
    return Promise.resolve({});
  }

  async proof_of_work(block_index, previous_hash){  

    const miner_address = this.node_owner_address;
    const { txs, miner_reward } = await this.get_prefered_mempool_txs();

    // Entry Time 
    let timestamp = new Date().getTime(); 

    // Proof Of Work
    return new Promise( resolve => {  
      for (var nonce=0; nonce <= this.maximumNonce; nonce++) {         
        const cur_timestamp = new Date().getTime();
        if(new Date(timestamp).getMinutes() !== new Date(cur_timestamp).getMinutes()) timestamp = cur_timestamp;
        
        // message         
        const message = `${block_index}${nonce}${timestamp}${miner_reward}${miner_address}${JSON.stringify(txs)}${previous_hash}`;  
        
        const hash_operation = `${CryptoJS.SHA256(`${message}`)}`; 
        if(`${hash_operation}`.substr(0, this.difficulty) === this.pattern){ 
          const msgObj = { block_index, nonce, timestamp, miner_reward, miner_address, txs, previous_hash };
          resolve({message, msgObj, hash_operation, success: true}); 
          break; 
        } 
      } 

      resolve({success: false})
    }); 
  } 

  async get_previous_block(){  
    const lastBlock = this.chain[this.chain.length-1]
    return Promise.resolve(lastBlock);
  }  

  hash(block){  
    let encoded_block = JSON.stringify(block);
    return `${CryptoJS.SHA256(encoded_block)}`;
  } 

  // Transaction Signature verification here
  validate_signature(sender, receiver, amount, signed){  
    return true;
  } 

  // Basic Balance balance implementation
  get_balance(address){  
    let bal = 0;

    // sort this.utxos desc
    // ... 

    // first occurrance
    this.utxos.forEach( tx => {
      if(tx.owner == address) bal = tx.amount_available;
    })

    return bal;
  }

  // Basic Steps for transaction implementation
  async add_transactions({sender, receiver, amount, signed, memo, fee}){  
    // Check balance
    const {balance} = await this.get_balance(sender);  
    if(balance < (Math.round(fee) + Math.round(amount)))  return false;  
    // confirm signature validity
    if(!this.validate_signature(sender, receiver, amount, signed)) return false;
    // Update mempool
    const tx = {sender, receiver, amount, signed, memo, fee}
    this.mempool.push(tx)
    // Update utxos
    const utxo_bal = {owner: sender, amount_available: (balance-amount+fee)}
    this.utxos.push(utxo_bal);    

    return Promise.resolve(this.chain.length)
  }  

  // Update blockchain nodes database
  async add_node(url){
    this.nodes.push(url);
  }
  
  // Complementary part of Consensus implementation (Basics)
  is_chain_valid(chain){  
    let block; 
    let previous_block = chain[0]; 
    let block_index = 1; 
    
    while(block_index < chain.length){ 
      block = chain[block_index]; 
      if(block['previous_hash'] != previous_block.hash){
        return false; 
      }

      previous_block = block; 
      block_index += 1; 
    } 
    return true;
  } 

  // Complementary part of Consensus implementation (Basics)
  async replace_chain(){  
    const network = this.nodes;
    logest_chain = null;
    max_length = this.chain.length;

    for (node in network){
      try{
        res = await axios.get(node);
        const {chain, length} = res.data;
        if(length > max_length && this.is_chain_valid(chain)){
          max_length = length;
          longest_chain = chain;
          // break
        }
      }catch(e){
        console.log(e)
      }     

    }

    // update longest
    if (longest_chain){
      this.chain = longest_chain
      return true
    }

    return false;
  }

}




var blockchain = new Blockchain();

module.exports = blockchain;