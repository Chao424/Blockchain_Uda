/* ===== SHA256 with Crypto-js ===============================
|  Learn more: Crypto-js: https://github.com/brix/crypto-js  |
|  =========================================================*/

const SHA256 = require('crypto-js/sha256');
const LevelSandbox = require('./LevelSandbox.js');
const bitcoin = require('bitcoinjs-lib');
const bitcoinMessage = require('bitcoinjs-message');
const hex2ascii = require('hex2ascii')
const TimeoutRequestsWindowTime = 5*60*1000;

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
  constructor(app){
    this.app = app;
    this.mempool= [];
    this.mempoolKey= [];
    this.memvalid= [];
    this.memvalidKey = [];
    this.timeoutRequests = [];
    this.index = 0;
    this.db = new LevelSandbox.LevelSandbox();
    this.db.getLevelDBData(0).then(()=>{
      this.AddRequestValidation();
      this.validateRequestByWallet();
      this.verifyAddressRequest();
      this.getBlockByContent();
    }).catch(()=>{
      this.generateGenesisBlock();
      this.AddRequestValidation();
      this.validateRequestByWallet();
      this.verifyAddressRequest();
      this.getBlockByContent();
    })
  }


/**
     * Implement a GET Endpoint to retrieve a block by height/ hash/ address
     */
  getBlockByContent(){
    let self = this;
    this.app.get("/block/:content",(req, res) => {
      // use RegExp to determine path experssion
      let regex_height = /^\d+$/;
      let regex_hash = /^hash\:(.*)$/;
      let regex_address = /^address\:(.*)$/;

      // send information based on content
      if(regex_height.test(req.params.content)){
        let height = req.params.content;
        self.db.getLevelDBData(height).then((result) => {
          let block = JSON.parse(result);
          if (height != 0){
            block.body.star['storyDecoded'] = hex2ascii(block.body.star.story);
          }
          res.send(block);
        }).catch(() => {
          res.send("No block yet")
          console.log(req.params.content)
        });
      }
      else if(regex_hash.test(req.params.content)){
        let hash = regex_hash.exec(req.params.content)[1];
        self.db.getLevelDBDataByHash(hash).then((result) => {
          let block = result;
          block.body.star['storyDecoded'] = hex2ascii(block.body.star.story);
          res.send(block);
        }).catch(() => {
          res.send("No block yet")
          console.log(hash)
        });
      }
      else if(regex_address.test(req.params.content)){
        let address = regex_address.exec(req.params.content)[1];
        self.db.getLevelDBDataByAddress(address).then((result) => {
          let block = result;
          block.forEach(element => {
            element.body.star['storyDecoded'] = hex2ascii(element.body.star.story);
          });
          res.send(block);
        }).catch(() => {
          res.send("No block yet")
          console.log(address)
        });
      }
    })
  }

  // add address request
  AddRequestValidation() {
    let self = this;
    this.app.post("/requestValidation", (req, res) => {
      if(req.body.address == undefined){
        res.send('Please provide valid content')
      }
      else if(self.mempoolKey.indexOf(req.body.address) != -1){
        //if address exist in mempool, only change validation window
        var index = self.mempoolKey.indexOf(req.body.address)
        let timeElapse = (new Date().getTime().toString().slice(0,-3)) - self.mempool[index].requestTimeStamp;
        let timeLeft = (TimeoutRequestsWindowTime/1000) - timeElapse;
        self.mempool[index].validationWindow = timeLeft;
        res.send(self.mempool[index]);
      }
      else{
        // create new request and add to mempool
        let walletAddress = req.body.address;
        let requestTimeStamp = new Date().getTime().toString().slice(0,-3);
        let message = walletAddress + ":" + requestTimeStamp + ":" + "starRegistry";
        self.mempoolKey.push(walletAddress);
        self.mempool.push({
          "walletAddress": walletAddress,
          "requestTimeStamp": requestTimeStamp,
          "message": message,
          "validationWindow": '300'
        });
        res.send(self.mempool[self.mempool.length-1]);
        self.timeoutRequests[walletAddress]=setTimeout(function(){ self.removeValidationRequest(walletAddress) }, TimeoutRequestsWindowTime );
      }
    })
  }

  validateRequestByWallet(){
    // validate request by message, address and signature
    let self = this;
    this.app.post("/message-signature/validate", (req, res) => {
      if(req.body.address == undefined){
        res.send('Please provide valid content')
      }
      else if(self.mempoolKey.indexOf(req.body.address) == -1){
        res.send('Messeage address not exists or expired')
      }
      else{
        let index = self.mempoolKey.indexOf(req.body.address);
        let message = self.mempool[index].message;
        let address = self.mempool[index].walletAddress;
        let signature = req.body.signature;
        let requestTimeStamp = self.mempool[index].requestTimeStamp;

        let timeElapse = (new Date().getTime().toString().slice(0,-3)) - requestTimeStamp;
        let timeLeft = (TimeoutRequestsWindowTime/1000) - timeElapse;
        self.memvalid.push({
          "registerStar": bitcoinMessage.verify(message, address, signature),
          "status": {
            "address": address,
            "requestTimeStamp": requestTimeStamp,
            "message": message,
            "validationWindow": timeLeft,
            "messageSignature": bitcoinMessage.verify(message, address, signature)
          }
        });
        self.memvalidKey.push(address)
        res.send(self.memvalid[self.memvalid.length-1]);
      }
    })
  }

  //varify block info request by wallet address 
  verifyAddressRequest(){
    let self = this;
    this.app.post("/block", (req, res) => {
      let index = self.memvalidKey.indexOf(req.body.address);
      if (index == -1){
        res.send("Address not validated yet")
      }
      else if(self.memvalid[index].registerStar){
        let ra = req.body.star.ra;
        let dec = req.body.star.dec;
        let starStory = req.body.star.story;
        let body = {
          "address":req.body.address,
          "star":{
            'ra': ra,
            'dec': dec,
            'story': Buffer.from(starStory).toString('hex')
          }
        }
        let newBlock = new Block(body);
        console.log(body);
        self.addBlock(newBlock).then((result) => {
          res.status(201).send(result)
        })
      }
      else {
        res.send("Please provide validate request with signature")
      }
    })
  }

  //function to remove expired data in mempool
  removeValidationRequest(address){
    var pos = this.mempoolKey.indexOf(address);
    this.mempool.splice(pos,1);
    this.mempoolKey.splice(pos,1);
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
    this.db.getLevelDBData(0).then().catch((result)=>{this.generateGenesisBlock().then((result2)=> this.addBlock(newBlock))})

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

/**
 * Exporting the BlockController class
 * @param {*} app 
 */
module.exports = (app) => { return new Blockchain(app);}