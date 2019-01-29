# Blockchain with Express framework

## app.js

app.js use express as RESTful Framework

## Blockchain.js

Blockchain.js continas two classes Block and Blockchain.
- Block create a singel block
- Blockchain used to build blocks into chain and connect with "Level" database

### AddRequestValidation()
Add request to mempool based on wallet address

- Use `POST` method to provide body information
```
this.app.post("/requestValidation", (req, res) => {}
```

- push to mempool array
```
self.mempool.push({
          "walletAddress": walletAddress,
          "requestTimeStamp": requestTimeStamp,
          "message": message,
          "validationWindow": '300'
        });
```
- set timeout funtion for 300 seconds
```
self.timeoutRequests[walletAddress]=setTimeout(function(){ self.removeValidationRequest(walletAddress) }, TimeoutRequestsWindowTime );
```
- Determine whether address exists in mempool
```
else if(self.mempoolKey.indexOf(req.body.address) != -1){
```

### validateRequestByWallet()
use `bitcoinMessage` to verify address

- add validation information to `memvalid` array
```
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
```

### verifyAddressRequest()
if address validated, add star information to block

```
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
```

### getBlockByContent()
Initiate in Blockchain class by using express and Level DB to get block by index
```
getBlockByIndex() {
  let self = this;
  this.app.get("/block/:index", (req, res) => {
    self.getBlock(req.params.index).then((result) => {
      res.send(result)
    }).catch(() => {
      res.send("No block yet")
    })
  });
}
```

## levelSandbox.js
Use Level to save and get block data
