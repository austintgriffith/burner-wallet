const clevis = require("clevis")
const chai = require("chai")
const colors = require('colors')

const assert = chai.assert
const fs = require('fs')

const clevisConfig = JSON.parse(fs.readFileSync("clevis.json").toString().trim())

function localContractAddress(contract){
  return fs.readFileSync(clevisConfig.CONTRACTS_FOLDER+"/"+contract+ "/" + contract + ".address").toString().trim()
}
function localContractAbi(contract){
  return JSON.parse(fs.readFileSync(clevisConfig.CONTRACTS_FOLDER+"/"+contract+ "/"+ contract +".abi").toString().trim())
}
function printTxResult(result){
  if(!result||!result.transactionHash){
    console.log("ERROR".red,"MISSING TX HASH".yellow)
  }else{
    console.log(tab,result.transactionHash.gray,(""+result.gasUsed).yellow)
  }
}
function bigHeader(str){
  return "########### "+str+" "+Array(128-str.length).join("#")
}
function rand(min, max) {
  return Math.floor( Math.random() * (max - min) + min );
}
function getPaddedHexFromNumber(num,digits){
  let hexIs = web3.utils.numberToHex(num).replace("0x","");
  while(hexIs.length<digits){
    hexIs = "0"+hexIs
  }
  return hexIs
}
const tab = "\t\t";


module.exports = {
  localContractAddress,
  contracts:fs.readFileSync(clevisConfig.ROOT_FOLDER + "/contracts.clevis").toString().trim().split("\n"),
  reload:()=>{
    describe('#reload() ', function() {
      it('should force browser to reload', async function() {
        fs.writeFileSync(clevisConfig.CRA_FOLDER + "/../public/reload.txt",Date.now());
      });
    });
  },
  compile:(contract)=>{
    describe('#compile() '+contract.magenta, function() {
      it('should compile '+contract.magenta+' contract to bytecode', async function() {
        this.timeout(90000)
        const result = await clevis("compile",contract)
        console.log(result)
        assert(Object.keys(result.contracts).length>0, "No compiled contacts found.")
        let count = 0
        for(let c in result.contracts){
          console.log("\t\t"+"contract "+c.blue+": ",result.contracts[c].bytecode.length)
          if(count++==0){
              assert(result.contracts[c].bytecode.length > 1, "No bytecode for contract "+c)
          }
        }
      });
    });
  },
  deploy:(contract,accountindex)=>{
    describe('#deploy() '+contract.magenta, function() {
      it('should deploy '+contract.magenta+' as account '+accountindex, async function() {
        this.timeout(360000)
        const result = await clevis("deploy",contract,accountindex)
        printTxResult(result)
        console.log(tab+"Address: "+result.contractAddress.blue)
        assert(result.contractAddress)
      });
    });
  },

  publish:()=>{
    describe('#publish() ', function() {
      it('should inject contract address and abi into web app', async function() {
        this.timeout(120000)
        const fs = require("fs")
        console.log(tab,"Publishing to CRA folder",clevisConfig.CRA_FOLDER)
        if(!fs.existsSync(clevisConfig.CRA_FOLDER)){
          fs.mkdirSync(clevisConfig.CRA_FOLDER);
        }
        if(!fs.existsSync(clevisConfig.CRA_FOLDER + "/contracts")){
          fs.mkdirSync(clevisConfig.CRA_FOLDER + "/contracts");
        }
        for(let c in module.exports.contracts){
          let thisContract = module.exports.contracts[c]
          console.log(tab,thisContract.magenta)
          let address = fs.readFileSync(clevisConfig.CONTRACTS_FOLDER + "/" + thisContract+"/"+thisContract+".address").toString().trim()
          console.log(tab,"ADDRESS:",address.blue)
          assert(address,"No Address!?")
          fs.writeFileSync(clevisConfig.CRA_FOLDER + "/contracts/"+thisContract+".address.js","module.exports = \""+address+"\"");
          let blockNumber = fs.readFileSync(clevisConfig.CONTRACTS_FOLDER +"/" + thisContract + "/"+thisContract+".blockNumber").toString().trim()
          console.log(tab,"blockNumber:",blockNumber.blue)
          assert(blockNumber,"No blockNumber!?")
          fs.writeFileSync(clevisConfig.CRA_FOLDER + "/contracts/" + thisContract+".blocknumber.js","module.exports = \""+blockNumber+"\"");
          let abi = fs.readFileSync(clevisConfig.CONTRACTS_FOLDER +"/" + thisContract +"/"+thisContract+".abi").toString().trim()
          fs.writeFileSync(clevisConfig.CRA_FOLDER + "/contracts/" + thisContract+".abi.js","module.exports = "+abi);
          let bytecode = fs.readFileSync(clevisConfig.CONTRACTS_FOLDER + "/" + thisContract +"/"+thisContract+".bytecode").toString().trim()
          fs.writeFileSync(clevisConfig.CRA_FOLDER + "/contracts/" + thisContract+".bytecode.js","module.exports = \""+bytecode+"\"");
        }
        fs.writeFileSync(clevisConfig.CRA_FOLDER + "/contracts/contracts.js","module.exports = "+JSON.stringify(module.exports.contracts));
        module.exports.reload()
      });
    });
  },
  metamask:()=>{
    describe('#transfer() ', function() {
      it('should give metamask account some ether or tokens to test', async function() {
        this.timeout(600000)
        let result = await clevis("send","0.10","0","0x2a906694d15df38f59e76ed3a5735f8aabcce9cb")///<<<-------- change this to your metamask accounts
        printTxResult(result)


        //make my metamask user an admin
        result = await clevis("contract","updateAdmin","Burner","0","0x2a906694d15df38f59e76ed3a5735f8aabcce9cb","true")
        printTxResult(result)



        result = await clevis("send","0.10","0","0x34aa3f359a9d614239015126635ce7732c18fdf3")///<<<-------- change this to your metamask accounts
        printTxResult(result)
        result = await clevis("contract","updateAdmin","Burner","0","0x34aa3f359a9d614239015126635ce7732c18fdf3","true")
        printTxResult(result)
        result = await clevis("contract","mint","Burner","0","0x34aa3f359a9d614239015126635ce7732c18fdf3","10000000000000000000")
        printTxResult(result)



        result = await clevis("contract","updateAdmin","BuffiDai","0","0x34aa3f359a9d614239015126635ce7732c18fdf3","true")
        printTxResult(result)
        result = await clevis("contract","mint","BuffiDai","0","0x34aa3f359a9d614239015126635ce7732c18fdf3","10000000000000000000")
        printTxResult(result)




        /*printTxResult(result)
        for(let a=1;a<9;a++){
          result = await clevis("send",""+(0.05*a),"2","0x0ca60587993c418904728f70bec0b164b55a8fb0")///<<<-------- change this to your metamask accounts
        }*/

        result = await clevis("send","1.99","0","0x548395928fee26be5ccc6de0c3a3411b416570a8")
        printTxResult(result)
        result = await clevis("send","0.10","0","0xfe49026946f11cb51c2d1b273346f34c07e5ab69")
        printTxResult(result)
        result = await clevis("send","0.10","0","0x2a906694d15df38f59e76ed3a5735f8aabcce9cb")
        printTxResult(result)

        let buffiDaiContractAddress = fs.readFileSync(clevisConfig.CONTRACTS_FOLDER + "/BuffiDai/BuffiDai.address").toString().trim()
        result = await clevis("send","5","0",buffiDaiContractAddress)
        printTxResult(result)

        result = await clevis("contract","mint","Burner","0","0x2a906694d15df38f59e76ed3a5735f8aabcce9cb","1000000000000000000")
        printTxResult(result)

        result = await clevis("contract","mint","Burner","0","0xfe49026946f11cb51c2d1b273346f34c07e5ab69","1000000000000000000")
        printTxResult(result)


        result = await clevis("send","0.10","0","0xa6b068b1ae5f781aabba9ba7a6c67491e4dd5e8a")
        printTxResult(result)
        result = await clevis("contract","mint","Burner","0","0xa6b068b1ae5f781aabba9ba7a6c67491e4dd5e8a","1000000000000000000")
        printTxResult(result)


        result = await clevis("send","0.10","0","0x6497e454db92af76df6a917435d0a8ecbe4e9903")
        printTxResult(result)
        result = await clevis("contract","mint","Burner","0","0x6497e454db92af76df6a917435d0a8ecbe4e9903","1000000000000000000")
        printTxResult(result)


        result = await clevis("send","0.10","0","0x53a910a6f8b5bded15cbdacc19f186027f84a36f")
        printTxResult(result)
        result = await clevis("contract","mint","Burner","0","0x53a910a6f8b5bded15cbdacc19f186027f84a36f","1000000000000000000")
        printTxResult(result)


        result = await clevis("send","0.10","0","0x021952bf46e3a144652544a9ad9dd9272c2d5e9a")
        printTxResult(result)
        result = await clevis("contract","mint","Burner","0","0x021952bf46e3a144652544a9ad9dd9272c2d5e9a","1000000000000000000")
        printTxResult(result)





        //result = await clevis("send","5","0","0x34aa3f359a9d614239015126635ce7732c18fdf3")///<<<-------- change this to your metamask accounts
        //printTxResult(result)
        //here is an example of running a funtion from within this object:
        //module.exports.mintTo("Greens",0,"0x2a906694d15df38f59e76ed3a5735f8aabcce9cb",20)
        //view more examples here: https://github.com/austintgriffith/galleass/blob/master/tests/galleass.js
      });
    });
  },


  ////----------------------------------------------------------------------------///////////////////


  ////    ADD YOUR TESTS HERE <<<<<<<<--------------------------------


  ////----------------------------------------------------------------------------///////////////////


  full:()=>{
    describe(bigHeader('COMPILE'), function() {
      it('should compile all contracts', async function() {
        this.timeout(6000000)
        const result = await clevis("test","compile")
        console.log('result', result);
        assert(result==0,"deploy ERRORS")
      });
    });
    describe(bigHeader('FAST'), function() {
      it('should run the fast test (everything after compile)', async function() {
        this.timeout(6000000)
        const result = await clevis("test","fast")
        assert(result==0,"fast ERRORS")
      });
    });
  },

  fast:()=>{
    describe(bigHeader('DEPLOY'), function() {
      it('should deploy all contracts', async function() {
        let result = await clevis("test","deploy")
        assert(result==0,"deploy ERRORS")
      });
    });
    describe(bigHeader('METAMASK'), function() {
      it('should deploy all contracts', async function() {
        this.timeout(6000000)
        const result = await clevis("test","metamask")
        assert(result==0,"metamask ERRORS")
      });
    });
    describe(bigHeader('PUBLISH'), function() {
      it('should publish all contracts', async function() {
        this.timeout(6000000)
        const result = await clevis("test","publish")
        assert(result==0,"publish ERRORS")
      });
    });

  },

}

let checkContractDeployment = async (contract)=>{
  const localAddress = localContractAddress(contract)
  const address = await clevis("contract","getContract","Example",web3.utils.fromAscii(contract))
  console.log(tab,contract.blue+" contract address is "+(localAddress+"").magenta+" deployed as: "+(address+"").magenta)
  assert(localAddress==address,contract.red+" isn't deployed correctly!?")
  return address
}

//example helper function
/*
makeSureContractHasTokens = async (contract,contractAddress,token)=>{
  const TokenBalance = await clevis("contract","balanceOf",token,contractAddress)
  console.log(tab,contract.magenta+" has "+TokenBalance+" "+token)
  assert(TokenBalance>0,contract.red+" doesn't have any "+token.red)
}

view more examples here: https://github.com/austintgriffith/galleass/blob/master/tests/galleass.js

*/
