const clevis = require("./clevis.js")
for(let c in clevis.contracts){
  clevis.compile(clevis.contracts[c])
}
