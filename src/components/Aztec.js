import React from 'react';
import Ruler from "./Ruler";

const { abiEncoder, note, proof, sign } = require('aztec.js');
const aztecDevUtils = require('@aztec/dev-utils');
const aztecContractArtifacts = require('@aztec/contract-artifacts');
const secp256k1 = require('@aztec/secp256k1');

//docs:
//https://github.com/AztecProtocol/AZTEC/blob/develop/packages/aztec.js/test/proof/joinSplit/proof.spec.js
//https://github.com/AztecProtocol/AZTEC/blob/develop/packages/protocol/test/ERC1724/ZkAsset.js


//todo:
//deploy https://github.com/AztecProtocol/AZTEC/blob/develop/packages/protocol/contracts/ERC1724/ZkAssetMintable.sol
//(this will take in the address of ERC20)
//docs: https://github.com/AztecProtocol/AZTEC/blob/develop/packages/protocol/test/ERC1724/ZkAssetMintable.js#L157

//more info:
//https://medium.com/aztec-protocol/how-to-code-your-own-confidential-token-on-ethereum-4a8c045c8651
//
//

const aztecAddresses = {
  "ACE": "0x606eDBb42422a1eeBCac46cfdA5A4EA200e85f4f",
  "AdjustSupply": "0x4Ed21f3b9092ED2EBC9B02937362505f7d82832E",
  "BilateralSwap": "0xAB685Be76346494e84eBa2883fc7C44ad66a1e84",
  "DividendComputation": "0x27ca006a0BB5c4d68A7a7698970374dE01ee5722",
  "ERC20Mintable": "0x4c9343CC183760244d4adbA8884eBB118A3d4BC0",
  "JoinSplit": "0x0652a14d71CA555FAd45A2B6B1D278324c5019dc",
  "ZkAsset": "0x717dBEd26D79EFcc435FDB02b4Abf31Aed2e38D2"
}

/*

  ^^ We will get all these contracts from aztec in final form without deps
      this I can then import into the project natively so we can test on ganache

      there will also be some functions you need to run to set everything up

 */


export default class Aztec extends React.Component {

  constructor(props) {
    super(props);

    console.log("PK",props.metaAccount.privateKey)

    this.state = {
      aztecAccount: secp256k1.accountFromPrivateKey(props.metaAccount.privateKey)
    }
  }
  componentDidMount(){
    console.log("aztecAccount",this.state.aztecAccount)
  }
  async createNotes(){
   console.log("Creating notes with public key "+this.state.aztecAccount.publicKey+"...")
   let amountOfDai = 1
   let notes = await note.create(this.state.aztecAccount.publicKey, amountOfDai)
   console.log("NOTES GENERATED",notes)
  }
  render(){
    let {buttonStyle, balance, address, privateKey} = this.props



    return (
      <div style={{padding:100}}>
        AZTEC WARRIOR!

        <button className="btn btn-large w-100" style={buttonStyle.secondary} onClick={()=>{
          this.createNotes()
        }}>
          BUTTON
        </button>


      </div>
    )
  }
}
