# Blockchain with Express framework

## app.js

app.js use express as RESTful Framework

## Blockchain.js

Blockchain.js continas two classes Block and Blockchain.
- Block create a singel block
- Blockchain used to build blocks into chain and connect with "Level" database

### GET Block Endpoint
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

### POST Block Endpoint
Initiate in Blockchain class by using express and Level DB to add block to chain

```
postNewBlock() {
  let self = this;
  this.app.post("/block", (req, res) => {
    if(req.body.body == undefined){
      res.send('Please provide valid content')
    }
    else{
      let newBlock = new Block(req.body.body);
      console.log("body:"+req.body);

      self.addBlock(newBlock).then((result) => {
        res.status(201).send(result)
      })
    }
  })
}
```
## levelSandbox.js
Use Level to save and get block data
