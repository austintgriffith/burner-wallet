import React from 'react';
import { Events, Blockie, Scaler } from "dapparatus";
import Web3 from 'web3';
import Ruler from "./Ruler";
import axios from "axios"

const { abiEncoder, note, proof, secp256k1, sign } = require('aztec.js');
const aztecDevUtils = require('@aztec/dev-utils');
const aztecContractArtifacts = require('@aztec/contract-artifacts');

//docs:
//https://github.com/AztecProtocol/AZTEC/blob/develop/packages/aztec.js/test/proof/joinSplit/proof.spec.js
//https://github.com/AztecProtocol/AZTEC/blob/develop/packages/protocol/test/ERC1724/ZkAsset.js


//todo:
//deploy https://github.com/AztecProtocol/AZTEC/blob/develop/packages/protocol/contracts/ERC1724/ZkAssetMintable.sol
//(this will take in the address of ERC20)
//docs: https://github.com/AztecProtocol/AZTEC/blob/develop/packages/protocol/test/ERC1724/ZkAssetMintable.js#L157


const aztecAddresses = {
  "ACE": "0x606eDBb42422a1eeBCac46cfdA5A4EA200e85f4f",
  "AdjustSupply": "0x4Ed21f3b9092ED2EBC9B02937362505f7d82832E",
  "BilateralSwap": "0xAB685Be76346494e84eBa2883fc7C44ad66a1e84",
  "DividendComputation": "0x27ca006a0BB5c4d68A7a7698970374dE01ee5722",
  "ERC20Mintable": "0x4c9343CC183760244d4adbA8884eBB118A3d4BC0",
  "JoinSplit": "0x0652a14d71CA555FAd45A2B6B1D278324c5019dc",
  "ZkAsset": "0x717dBEd26D79EFcc435FDB02b4Abf31Aed2e38D2"
}


export default class YourModule extends React.Component {

  constructor(props) {
    super(props);

    this.state = {
      yourVar: "",
      YourContract: false,
      yourContractBalance: 0,
      toAddress: (props.scannerState ? props.scannerState.toAddress : ""),
      aztecAccounts: [...new Array(10)].map(() => secp256k1.generateAccount())
    }


  }

  async createNotes(){
    console.log("Creating notes...")
    let notes = await Promise.all([
        ...this.state.aztecAccounts.map(({ publicKey }, i) => note.create(publicKey, i * 10)),
        ...this.state.aztecAccounts.map(({ publicKey }, i) => note.create(publicKey, i * 10)),
    ]);
    console.log("NOTES GENERATED",notes)
  }

  componentDidMount(){
    console.log("YOUR MODULE MOUNTED, PROPS:",this.props)
    /*
        -- LOAD YOUR CONTRACT --
        Contract files loaded from:
        src/contracts/YourContract.abi
        src/contracts/YourContract.address
        src/contracts/YourContract.blocknumber.js // the block number it was deployed at (for efficient event loading)
        src/contracts/YourContract.bytecode.js // if you want to deploy the contract from the module (see deployYourContract())
    */
    /*this.setState({
     YourContract: this.props.contractLoader("YourContract")
    },()=>{
     console.log("YOURCONTRACT IS LOADED:",this.state.YourContract)
   })*/

    setInterval(this.pollInterval.bind(this),2500)
    setTimeout(this.pollInterval.bind(this),30)
  }

  async pollInterval(){
    console.log("POLL")
    /*if(this.state && this.state.YourContract){
      let yourVar = await this.state.YourContract.YourVar().call()
      let yourContractBalance = await this.props.web3.eth.getBalance(this.state.YourContract._address)
      //let ensName = await this.props.ensLookup("austingriffith.eth")
      let mainnetBlockNumber = await this.props.mainnetweb3.eth.getBlockNumber()
      let xdaiBlockNumber = await this.props.xdaiweb3.eth.getBlockNumber()
      yourContractBalance = this.props.web3.utils.fromWei(yourContractBalance,'ether')
      this.setState({yourVar,yourContractBalance,mainnetBlockNumber,xdaiBlockNumber})

    }*/
  }

  clicked(name){
    console.log("secondary button "+name+" was clicked")
    /*
    Time to make a transaction with YourContract!
    */
    /*this.props.tx(this.state.YourContract.updateVar(name),120000,0,0,(result)=>{
      console.log(result)
    })*/

  }
  deployYourContract() {
    console.log("Deploying YourContract...")
    //
    //  as noted above you need src/contracts/YourContract.bytecode.js
    //  to be there for this to work:
    //
    /*let code = require("../contracts/YourContract.bytecode.js")
    this.props.tx(this.state.YourContract._contract.deploy({data:code}),640000,(receipt)=>{
      let yourContract = this.props.contractLoader("YourContract",receipt.contractAddress)
      this.setState({ YourContract: yourContract})
    })*/
  }
  render(){

    return (
      <div>
        <div className="form-group w-100">

          <div style={{width:"100%",textAlign:"center"}}>
            <div style={{padding:20}}>
              The logged in user is
              <Blockie
                address={this.props.address}
                config={{size:6}}
              />
              {this.props.address.substring(0,8)}
              <div>
                {this.props.dollarDisplay(this.props.balance)}<img src={this.props.xdai} style={{maxWidth:22,maxHeight:22}}/>
              </div>
              <div>
                {this.props.dollarDisplay(this.props.daiBalance)}<img src={this.props.dai} style={{maxWidth:22,maxHeight:22}}/>
              </div>
              <div>
                {this.props.dollarDisplay(this.props.ethBalance*this.props.ethprice)}<img src={this.props.eth} style={{maxWidth:22,maxHeight:22}}/>
              </div>
            </div>

            <pre>
              {JSON.stringify(this.state.aztecAccounts,null,2)}
            </pre>

            <Ruler/>

            <div>
              Network {this.props.network} is selected and on block #{this.props.block}.
            </div>
            <div>
              Gas price on {this.props.network} is {this.props.gwei} gwei.
            </div>
            <div>
              mainnetweb3 is on block {this.state.mainnetBlockNumber} and version {this.props.mainnetweb3.version}
            </div>
            <div>
              xdaiweb3 is on block {this.state.xdaiBlockNumber} and version {this.props.xdaiweb3.version}
            </div>
            <div>
              The current price of ETH is {this.props.dollarDisplay(this.props.ethprice)}.
            </div>
          </div>

          <button className={'btn btn-lg w-100'} style={this.props.buttonStyle.primary}
                  onClick={this.createNotes.bind(this)}>
            Generate Notes
          </button>

        </div>
      </div>
    )

  }
}
