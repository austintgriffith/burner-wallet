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
        assert(result, "Failed to compile contacts.")
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

  gsn:()=>{
    describe(bigHeader('RELAY HUB GSN '), function(){
      it('should set Relay Hub address to Relay Recepient and provide it with a deposit', async function(){
        this.timeout(600000)


        /*
        const Web3 = require('web3')
        const web3ForStake = new Web3(new Web3.providers.HttpProvider(clevisConfig.provider))
        let relayHubAddress = "0x49a984490a7762B0e5d775f0FfA608899Ebe2ee8"///<<<-------- Stable if using tbk docker. Change this to your deployed Relay Hub address
        let linksAddress = localContractAddress("Links")
        console.log("linksAddress",linksAddress)
        let linksAbi = localContractAbi("Links")
        let accounts = await web3ForStake.eth.getAccounts()
        console.log("accounts",accounts)
        if(!accounts||accounts.length<=0){
          accounts = await clevis("accounts")
          console.log(accounts)
        }
        let links = new web3ForStake.eth.Contract(linksAbi, linksAddress, ({from: accounts[0]}))
        await links.methods.set_hub(relayHubAddress).send()
        await links.methods.deposit_to_relay_hub().send({value: web3ForStake.utils.toWei("0.5", "ether")})
        */


        let relayHubAddress = "0x49a984490a7762B0e5d775f0FfA608899Ebe2ee8" //<----- RELAY HUB FOR xDAI!!!!!

        //update relay hub in Links contract:
        result = await clevis("contract","set_hub","Links","0",relayHubAddress)///<<<-------- change this to the xDai relay hub!
        printTxResult(result)
        let hubAddress = await clevis("contract","get_hub_addr","Links")///<<<-------- change this to the xDai relay hub!
        console.log("\t\t\thubAddress:",hubAddress.green)

        //deposit funds as Links contract
        result = await clevis("contract","deposit_to_relay_hub","Links","0","500000000000000000")///<<<-------- change this to the xDai relay hub!
        printTxResult(result)

      });
    })
  },

  metamask:()=>{
    describe('#transfer() ', function() {
      it('should give metamask account some ether or tokens to test', async function() {
        this.timeout(600000)
        let result = await clevis("send","1","0","0x2a906694d15df38f59e76ed3a5735f8aabcce9cb")///<<<-------- change this to your metamask accounts
        printTxResult(result)

        let accounts = await clevis("accounts")
        await clevis('contract', 'adminMint', 'VendingMachine', "0", accounts[1], '10000000000000000000')

        result = await clevis("contract","adminMint","VendingMachine","0","0x2a906694d15df38f59e76ed3a5735f8aabcce9cb","10000000000000000000")
        printTxResult(result)

        result = await clevis("send","0.10","0","0x34aa3f359a9d614239015126635ce7732c18fdf3")///<<<-------- change this to your metamask accounts
         printTxResult(result)



        // GAS UP YOUR RANDOM INCOG ACCOUNTS HERE:

        result = await clevis("send","0.50","0","0xedf39c04c5e941789c08acc2b252e91faef73354")///<<<-------- change this to your metamask accounts
        printTxResult(result)
        result = await clevis("send","0.10","0","0x3a48736d0e60b77e8fbe6791372091e1ba80c590")///<<<-------- change this to your metamask accounts
        printTxResult(result)

        result = await clevis("send","0.001","0","0x0876a604b2e4455fdfee24f042e1c95cb8cd4603")///<<<-------- change this to your metamask accounts
        printTxResult(result)

        result = await clevis("contract","mintNextTokenWithTokenURI","Badges","0","0x75b459791dad37746ba60c8665a065e1255bff63","https://badges.xdai.io/ethdenver/v1/json/buffalo.json")
        printTxResult(result)


        result = await clevis("contract","mintNextTokenWithTokenURI","Badges","0","0x0876a604b2e4455fdfee24f042e1c95cb8cd4603","https://badges.xdai.io/ethdenver/v1/json/buffalo.json")
        printTxResult(result)


        result = await clevis("contract","mintNextTokenWithTokenURI","Badges","0","0x3a48736d0e60b77e8fbe6791372091e1ba80c590","https://badges.xdai.io/ethdenver/v1/json/buffalo.json")
        printTxResult(result)

        result = await clevis("send","0.10","0","0x75b459791dad37746ba60c8665a065e1255bff63")///<<<-------- change this to your metamask accounts
        printTxResult(result)


      });
    });
  },


  ////----------------------------------------------------------------------------///////////////////



  version:()=>{
    describe('#version() ', function() {
      it('should give metamask account some ether or tokens to test', async function() {
        this.timeout(600000)
        let result = await clevis("version")///<<<-------- change this to your metamask accounts
        console.log("\t\t",result)
      })
    })
  },

  ////    ADD YOUR TESTS HERE <<<<<<<<--------------------------------
  updateVendingMachineAddress:()=>{
    describe('#transfer() ', function() {
      it('update vending machine address', async function() {
        this.timeout(600000)
        let vendingMachineAddress = require("fs").readFileSync("./contracts/VendingMachine/VendingMachine.address").toString().trim()
        console.log("changeVendingMachine to vendingMachineAddress:",vendingMachineAddress)
        let result = await clevis('contract', 'changeVendingMachine', 'ERC20Vendable', 0, vendingMachineAddress)
        console.log("RESULT",result)
        printTxResult(result)
        //assert(result==0,"deploy ERRORS")
        //addAdmin
        result = await clevis("contract","addAdmin","VendingMachine","0","0x2a906694d15df38f59e76ed3a5735f8aabcce9cb")
        printTxResult(result)

      });
    });
  },

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

  withrelay:()=>{
    describe(bigHeader('FULL'), function() {
      it('should run the full test (everything after compile)', async function() {
        this.timeout(6000000)
        const result = await clevis("test","full")
        assert(result==0,"full ERRORS")
      });
    });
    describe(bigHeader('RELAY HUB'), function(){
      it('should set Relay Hub address to Relay Recepient and provide it with a deposit', async function(){
        const Web3 = require('web3')
        const web3ForStake = new Web3(new Web3.providers.HttpProvider(clevisConfig.provider))
        let relayHubAddress = "0x9C57C0F1965D225951FE1B2618C92Eefd687654F"///<<<-------- Stable if using tbk docker. Change this to your deployed Relay Hub address
        let linksAddress = localContractAddress("Links")
        let linksAbi = localContractAbi("Links")
        const accounts = await web3ForStake.eth.getAccounts()
        let links = new web3ForStake.eth.Contract(linksAbi, linksAddress, ({from: accounts[0]}))
        await links.methods.set_hub(relayHubAddress).send()
        await links.methods.deposit_to_relay_hub().send({value: web3ForStake.utils.toWei("0.5", "ether")})
      });
    })
  },

  fast:()=>{
    describe(bigHeader('DEPLOY'), function() {
      it('should deploy all contracts', async function() {
        this.timeout(6000000)
        let result = await clevis("test","deploy")
        assert(result==0,"deploy ERRORS")
      });
    });
    describe(bigHeader('AFTERDEPLOY'), function() {
      it('should do afterDeploy actions', async function() {
        this.timeout(6000000)
        let result = await clevis("test","afterDeploy")
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
