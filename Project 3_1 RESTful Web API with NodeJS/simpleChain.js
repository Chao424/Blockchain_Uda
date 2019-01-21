/* ===== SHA256 with Crypto-js ===============================
|  Learn more: Crypto-js: https://github.com/brix/crypto-js  |
|  =========================================================*/

const SHA256 = require('crypto-js/sha256');
const LevelSandbox = require('./LevelSandbox.js');


/* ===== Block Class ==============================
|  Class with a constructor for block 			   |
|  ===============================================*/

class Block{
	constructor(data){
     this.hash = "",
     this.height = 0,
     this.body = data,
     this.time = 0,
     this.previousBlockHash = ""
    }
}

/* ===== Blockchain Class ==========================
|  Class with a constructor for new blockchain 		|
|  ================================================*/

class Blockchain{
  constructor(){
    this.chain = [];
    this.db = new LevelSandbox.LevelSandbox();
    this.getBlock(0).then((result)=>{console.log('asdf')}).catch(()=>{
      console.log('aaaa');
      this.generateGenesisBlock().then((result)=>{'GenesisBlock Added'})
    })
    // this.generateGenesisBlock()
  }



  generateGenesisBlock(){
      let GenesisBlock = new Block("First block in the chain - Genesis block")
      GenesisBlock.time = new Date().getTime().toString().slice(0,-3);
      GenesisBlock.hash = SHA256(JSON.stringify(GenesisBlock)).toString();
      return this.db.addLevelDBData(0,JSON.stringify(GenesisBlock).toString());
  }



  // Add new block
  addBlock(newBlock){
    let self = this
    //check whether GenesisBlock exists, if not, generate one then addBlock
    this.generateGenesisBlock();
    // persisData is defined in levelSandbox, it will return a promise of last block information
    return self.db.persisData().then((array)=>{
        //Block height
        newBlock.height= (Number(JSON.parse(array).height)+1);

        //Previous Blockhash
        newBlock.previousBlockHash=JSON.parse(array)['hash'];

        //UTC timestamp
        newBlock.time= new Date().getTime().toString().slice(0,-3);

        //Block hash
        newBlock.hash= SHA256(JSON.stringify(newBlock)).toString();

        return self.db.addLevelDBData(newBlock.height, JSON.stringify(newBlock).toString())
      })
  }



  // Get block height
    getBlockHeight(){
      return this.db.getBlocksCount()
  }

    // get block
    getBlock(blockHeight){
      // return object as a formise
      // return block information;
      return this.db.getLevelDBData(blockHeight)
    }

    // validate block
    validateBlock(blockHeight){
      // get block promise
      return this.getBlock(blockHeight).then((value) => {
          let block = JSON.parse(value)
          // get block hash
          let blockHash = block.hash;
          // remove block hash to test block integrity
          block.hash = '';
          // generate block hash
          let validBlockHash = SHA256(JSON.stringify(block)).toString();
          // Compare
          return new Promise(function(resolve){
            if(validBlockHash === blockHash) {
              resolve(true);
            } else {
              resolve(false);
            }
          })
        });
    }

    // combine the validation of block and linke
    validateLink(blockHeight){
      //get block1 hash
      return this.getBlock(blockHeight).then((value) => {
        let block = JSON.parse(value)
        let blockHash = block.hash;
        // remove block hash to test block integrity
        block.hash = '';
        // generate block hash
        let validBlockHash = SHA256(JSON.stringify(block)).toString();
        //get next block's previous hash
        return this.getBlock(blockHeight+1).then((value2) =>{
          let block2 = JSON.parse(value2)
          let blockHash2=block2.previousBlockHash;
          return new Promise(function(resolve){
            // can pass only when meet both condition 
            if(blockHash === blockHash2 && validBlockHash === blockHash){
              resolve(true);}
            else{
              resolve(false);
            }
          })
        })
      });
    }

   // Validate blockchain
    validateChain(){
      let self=this;
      let errorLog = [];
      //first get blockheight
      self.getBlockHeight().then((result) => {
        let blockheight = result;
        let i = 0;
        //use validatelink to validate both block and links
        (function Loop(i){
          self.validateLink(i).then((result2) => {
            if(!result2) {
              errorLog.push(i);
            }
            i++;
            if (i < blockheight) {
              Loop(i);
            }
            else{
              //last block cannot validate linke
              self.validateBlock(blockheight).then((result3)=>{
                if(!result3){
                  errorLog.push(i);
                }
                if (errorLog.length>0) {
                  console.log('Block errors = ' + errorLog.length);
                  console.log('Blocks: '+errorLog);
                } else {
                  console.log('No errors detected');
                }
              })
            }
          })
        })(0)
      })
    }
}


/* ===== Create test blocks =======================
|  Class with a constructor for new blockchain 		|
|  ================================================*/

// new Promise(function(resolve){
//   let myBlockChain=new Blockchain(); 
//   resolve(myBlockChain)
// }).then((myBlockChain)=>{
//   myBlockChain.getBlock(0).then((result)=>console.log(result))
// })

let myBlockChain=new Blockchain(); 
myBlockChain.getBlock(0).then((result)=>console.log(result))


// myBlockChain.generateGenesisBlock().then((result)=>{
//   console.log(result);
//   myBlockChain.getBlock(0).then((result)=>console.log(result))
// })
// myBlockChain.getBlock(0).then((result)=>console.log(result))

// (function theLoop (i) {
//     setTimeout(function () {
//         let blockTest = new Block("Test Block - " + (i + 1));
//         myBlockChain.addBlock(blockTest).then((result) => {
//             console.log(result);
//             i++;
//             if (i < 20) theLoop(i);
//         });
//     }, 100);
// })(0);


// validation test
// myBlockChain.getBlockHeight().then((result)=>console.log(result))
// myBlockChain.getBlock(0).then((result)=>console.log(result))
// myBlockChain.validateChain()