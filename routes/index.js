var express = require('express'); 
var router = express.Router(); 

"use strict";

var blockchain = require('../controller/blockchain'); 


// Mining block route
router.get('/mine_block', async (req, res, next) => {
  
    const previous_block = await blockchain.get_previous_block();   
    const previous_hash = previous_block.hash; 
    const chainLen = await blockchain.get_chainlen();
    const block_index = chainLen + 1; 
  
    const data = await blockchain.proof_of_work(block_index, previous_hash);     
    
    if(!data.success) return res.status(200).json(data); 
  
    const block = await blockchain.create_block(data); 
    
    const response ={ "message": "Block mined",
                    "index": block['index'],
                    "timestamp": block['timestamp'],
                    "proof": block['proof'],
                    "transactions": block['txs'] }; 

    return Promise.resolve(response);
})

// Get full chain
router.get('/get_chain', async (req, res, next) => {   
  const chain = await blockchain.get_chain();
  return res.status(200).json({ 
      'chain': chain,
      'length': chain.length
    });  
});

// Add transaction
router.post('/add_transaction', async (req, res, next) => {   
  const json = req.body; 
  // Check mismatch 
  const transaction_keys = ['sender', 'receiver', 'amount', 'signed', 'memo', 'fee']; 
  for (const key in Object.keys(json)) {
    if(!transaction_keys.includes(json[key]))  
      return res.status(200).json({'error':'Some elements of the transaction is missing'});   
  }      
   
  // Add transaction 
  const index = await blockchain.add_transactions(json);   
  if(!index) return res.status(200).json({'error': 'Insufficient balance'});  
  
  const response = {'message': `This transaction will be added in the next block ${index}` };   
  
  return res.status(201).json(response);  

}); 

// Connect new nodes
router.post('/connect_node', async (req, res) => {
  const { nodes } = req.body; // array of nodes
  if(nodes.length < 1) return res.json({error: 'no node found'});
  
  for(node in nodes) blockchain.add_node(node);
  
  res.json({
    message: "All the nodes are now connected.", 
    total_nodes: blockchain.nodes.length
  })  
})

// Replace Chain
router.get('/replace_chain', function(req, res, next){
  const is_chain_replaced = blockchain.replace_chain();
  const response = (is_chain_replaced)
                    ? {'message': 'Blockchain Updated',
                      'new_chain': blockchain.chain}
                    : {'message': 'Blochain Not Changed',
                      'actual_chain': blockchain.chain};
  return res.status(200).json(response);
}); 

// Verify Own Chain
// router.get('/is_valid', (req, res, next) => {  
//   const validation = blockchain.is_chain_valid(blockchain.chain);
//   return (validation)
//     ? res.status(200).json({'message': 'valid'})
//     : res.status(200).json({'message': 'invalid'});
// });

module.exports = router;



