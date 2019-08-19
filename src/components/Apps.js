import React from "react";
import { Scaler } from "dapparatus";
import icon from '../bufficorn.png';
import gnosis from '../gnosis.jpg';
import helena from '../helena.jpg';
import emojicoin from '../emojicoin.png';
import daog from '../daog.png';
import Ruler from "./Ruler";

let base64url = require('base64url')

function pkToUrl(web3,pk) {
  return base64url(web3.utils.hexToBytes(pk))
}

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


    let safeDisplay = (
      <div>

      <div className="balance row" style={{cursor:"pointer",paddingBottom:0,paddingLeft:20}} onClick={async ()=>{

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
      }}>
      <div className="avatar col p-0">
      <img src={gnosis} style={{maxWidth:50}}/>
      <div style={{position:'absolute',whiteSpace:"nowrap",left:60,top:12,fontSize:14,opacity:0.77}}>
      Gnosis Safe
      </div>
      </div>
      <div style={{position:"absolute",right:25,marginTop:15}}>
      <Scaler config={{startZoomAt:400,origin:"200px 30px",adjustedZoom:1}}>
      <div style={{fontSize:30,letterSpacing:-2}}>
      Install
      </div>
      </Scaler>
      </div>
      </div>
      <Ruler/>
      </div>
    )

    return (
      <div>
        {safeDisplay}
        <div>
        <div className="balance row" style={{cursor:"pointer",paddingBottom:0,paddingLeft:20}} onClick={async ()=>{
            window.location = "https://helena.xdai.io/pk#"+pkToUrl(this.props.web3,this.props.privateKey)
        }}>
        <div className="avatar col p-0">
        <img src={helena} style={{maxWidth:50}}/>
        <div style={{position:'absolute',whiteSpace:"nowrap",left:60,top:12,fontSize:14,opacity:0.77}}>
        Helena Prediction Markets
        </div>
        </div>
        <div style={{position:"absolute",right:25,marginTop:15}}>
        <Scaler config={{startZoomAt:400,origin:"200px 30px",adjustedZoom:1}}>
        <div style={{fontSize:30,letterSpacing:-2}}>
        Play
        </div>
        </Scaler>
        </div>
        </div>
        <Ruler/>
        </div>


        <div>
        <div className="balance row" style={{cursor:"pointer",paddingBottom:0,paddingLeft:20}} onClick={async ()=>{
            window.location = "https://emojicoin.exchange/pk#"+pkToUrl(this.props.web3,this.props.privateKey)
        }}>
        <div className="avatar col p-0">
        <img src={emojicoin} style={{maxWidth:50}}/>
        <div style={{position:'absolute',whiteSpace:"nowrap",left:60,top:12,fontSize:14,opacity:0.77}}>
        Emojicoin.Exchange
        </div>
        </div>
        <div style={{position:"absolute",right:25,marginTop:15}}>
        <Scaler config={{startZoomAt:400,origin:"200px 30px",adjustedZoom:1}}>
        <div style={{fontSize:30,letterSpacing:-2}}>
        Play
        </div>
        </Scaler>
        </div>
        </div>
        <Ruler/>
        </div>


        <div>
        <div className="balance row" style={{cursor:"pointer",paddingBottom:0,paddingLeft:20}} onClick={async ()=>{
            window.location = "https://daog.io/pk#"+pkToUrl(this.props.web3,this.props.privateKey)
        }}>
        <div className="avatar col p-0">
        <img src={daog} style={{maxWidth:50}}/>
        <div style={{position:'absolute',whiteSpace:"nowrap",left:60,top:12,fontSize:14,opacity:0.77}}>
        The DAOG
        </div>
        </div>
        <div style={{position:"absolute",right:25,marginTop:15}}>
        <Scaler config={{startZoomAt:400,origin:"200px 30px",adjustedZoom:1}}>
        <div style={{fontSize:30,letterSpacing:-2}}>
        Play
        </div>
        </Scaler>
        </div>
        </div>
        <Ruler/>
        </div>
      </div>
    );
  }
}
