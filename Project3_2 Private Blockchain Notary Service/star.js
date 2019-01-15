const bitcoin = require('bitcoinjs-lib');
const bitcoinMessage = require('bitcoinjs-message');
const hex2ascii = require('hex2ascii')
const level = require('level');
const chainDB = './chaindata';

db=level(chainDB);

var hash = '322516e6cea4b5a5c70a1d35fe6a70e5604350f01870793e807cda4065d7b673';
db.createReadStream()
  .on('data', function (data) {
    // console.log(data.key, '=', JSON.parse(data.value).hash)
    if(JSON.parse(data.value).hash === hash){
        block = JSON.parse(data.value);
        console.log(block)
    }
  })
  .on('error', function (err) {
    console.log('Oh my!', err)
  })
  .on('close', function () {
    console.log('Stream closed')
  })
  .on('end', function () {
    console.log('Stream ended')
  })