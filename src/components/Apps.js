import React from "react";
import { Scaler } from "dapparatus";
import icon from '../bufficorn.png';
import gnosis from '../gnosis.jpg';
import helena from '../helena.jpg';
import emojicoin from '../emojicoin.png';
import daog from '../daog.png';
import Ruler from "./Ruler";
import Web3 from "web3";
import base64url from "base64url";

const AppLink = ({ name, image, onClick, url, privateKey, verb }) => (
  <div>
    <div
      className="balance row"
      style={{cursor:"pointer",paddingBottom:0,paddingLeft:20}}
      onClick={url ? () => {
        window.open(privateKey
          ? url + "pk#" + base64url(Web3.utils.hexToBytes(privateKey))
          : url, "_blank");
      } : onClick}
    >
      <div className="avatar col p-0">
        <img src={image} style={{maxWidth: 50}}/>
        <div style={{position:'absolute',whiteSpace:"nowrap",left:60,top:12,fontSize:14,opacity:0.77}}>
          {name}
        </div>
      </div>
      <div style={{position:"absolute",right:25,marginTop:15}}>
        <Scaler config={{startZoomAt:400,origin:"200px 30px",adjustedZoom:1}}>
          <div style={{fontSize:30,letterSpacing:-2}}>
            {verb || 'Play'}
          </div>
        </Scaler>
      </div>
    </div>
    <Ruler/>
  </div>
);

export default class Apps extends React.Component {
  constructor(props) {
    super(props);
    let initialState = {};
  }
  render() {
    let { changeAlert, url } = this.props;

    let qrSize = Math.min(document.documentElement.clientWidth, 512) - 90;
    let qrValue = url;

    let opacity = 1.0

    let iconDisplay

    if(typeof icon == "string" && icon.length<8){
      iconDisplay = (
        <div style={{width:50,height:50,fontSize:42,paddingTop:13}}>
          {icon}
        </div>
      )
    }else{
      iconDisplay = <img src={icon} style={{maxWidth:50,maxHeight:50}}/>
    }


    const openGnosis = async () => {
        let creationNonce = 1

        const abi = require('ethereumjs-abi')

        //address[] _owners, uint256 _threshold, address to, bytes data, address paymentToken, uint256 payment, address paymentReceiver
        let initData = await this.props.contracts["GnosisSafe"].setup([this.props.address], 1, "0x0000000000000000000000000000000000000000", "0x", "0x0000000000000000000000000000000000000000", 0, "0x0000000000000000000000000000000000000000").encodeABI()

        let proxyCreationCode = await this.props.contracts["ProxyFactory"].proxyCreationCode().call()
        console.log("proxyCreationCode",proxyCreationCode)
        let deployData = abi.rawEncode(['address'],[ this.props.contracts["GnosisSafe"]._address ]).toString('hex')

        let encodedNonce = abi.rawEncode(['uint256'], [creationNonce]).toString('hex')
        const ethUtil = require('ethereumjs-util')
        let target = "0x" + ethUtil.generateAddress2(this.props.contracts["ProxyFactory"]._address, ethUtil.keccak256("0x" + ethUtil.keccak256(initData).toString("hex") + encodedNonce), proxyCreationCode + deployData).toString("hex")
        console.log("    Predicted safe address: " + target)
        this.props.changeView('loader')
        console.log("initData",initData)
        this.props.tx(
          this.props.contracts["ProxyFactory"].createProxyWithNonce(this.props.contracts["GnosisSafe"]._address,initData,creationNonce),1100000,"0x00",0,
          (result)=>{
            console.log("RESULT",result)
            localStorage.setItem(this.props.address+"safe",target)
            console.log("Setting safe contract...")
            this.props.setSafeContract(target)
            this.props.changeView('main')
          }
        )
    }

    return (
      <div>
        <AppLink name="Gnosis Safe" image={gnosis} onClick={openGnosis} verb="Install" />
        <AppLink name="Helena Prediction Markets" image={helena} url="https://burner.helena.network/" privateKey={this.props.privateKey} />
        <AppLink name="Emojicoin.Exchange" image={emojicoin} url="https://emojicoin.exchange/" privateKey={this.props.privateKey} />
        <AppLink name="The DAOG" image={daog} url="https://daog.io/" privateKey={this.props.privateKey} />
      </div>
    );
  }
}
