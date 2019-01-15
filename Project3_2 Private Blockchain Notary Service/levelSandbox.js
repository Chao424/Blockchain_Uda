/* ===== Persist data with LevelDB ==================
|  Learn more: level: https://github.com/Level/level |
/===================================================*/

const level = require('level');
const chainDB = './chaindata';

class LevelSandbox {

    constructor() {
        this.db = level(chainDB);
    }

    // Get data from levelDB with key (Promise)
    getLevelDBData(key){
        let self = this;
        return new Promise(function(resolve, reject) {
            self.db.get(self.heightTransfer(key),(err,value) => {
                if(err){
                    if(err.type == 'NotFoundRrror'){
                        resolve(undefined)
                    }else{
                        // console.log('Block ' + key + ' get failed',err)
                        reject(err)
                    }
                }else{
                    resolve(value)
                }
            });
        });
    }

    getLevelDBDataByHash(hash){
        let self = this;
        let block = null;
        return new Promise(function(resolve, reject){
            self.db.createReadStream()
            .on('data', function (data) {
                if(JSON.parse(data.value).hash === hash){
                    block = JSON.parse(data.value);
                    console.log(block);
                }
            })
            .on('error', function (err) {
                reject(err)
            })
            .on('close', function () {
                resolve(block);
            });
        });
    }

    getLevelDBDataByAddress(address){
        let self = this;
        let block = [];
        return new Promise(function(resolve, reject){
            self.db.createReadStream()
            .on('data', function (data) {
                if(JSON.parse(data.value).body.address === address){
                    block.push(JSON.parse(data.value));
                }
            })
            .on('error', function (err) {
                reject(err)
            })
            .on('close', function () {
                resolve(block);
            });
        });
    }



    // Add data to levelDB with key and value (Promise)
    addLevelDBData(key, value) {
        let self = this;
        return new Promise(function(resolve, reject) {
            self.db.put(self.heightTransfer(key),value,err =>{
                if(err){
                    console.log('Failed to add Block ' + key,err)
                    reject(err);
                }
                else{
                    resolve(value)
                }
            });
        });
    }

    // Method that return the height
    getBlocksCount() {
        let self = this;
        return new Promise(function(resolve,reject){
            var count = 0
            self.db.createReadStream()
            .on('data',function(data){
                count = Number(data.key)
            })
            .on('error',function(err){
                console.log('Unable to read data stream!', err);
                reject(err);
            })
            .on('close',function(){
                resolve(count)
            })
        })
    }
        
    persisData(){
      let self = this
      return new Promise(function(resolve,reject){
        var array = ''
        self.db.createReadStream()
        .on('data',function(data){
          array=data.value
        })
        .on('error',function(err){
          reject(err)
        })
        .on('close',function(){
          resolve(array);
        })
      });
    };


  heightTransfer(num){
    if(num===0 || num === '0'){
      return "00000"
    }
    else{
      let h2 = num;
    (function Loop(i){
      if(num<10000){
        h2='0'+h2;
        num=num*10
        return Loop(i-1)
      }
    })(10);
    return h2 
    }
  }
}

// let abc=new LevelSandbox
// console.log(abc.heightTransfer(5))
// let blast = new Block("test 1")
// abc.addLevelDBData(1,JSON.stringify(blast).toString()).then((value)=>{
//   console.log(value)
//   abc.persisData().then((result)=>{console.log(JSON.parse(result)['height'])})
// })
module.exports.LevelSandbox = LevelSandbox;