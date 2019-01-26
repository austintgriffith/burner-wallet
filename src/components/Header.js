import React from 'react';
import { Scaler, Blockie } from "dapparatus";
import burnerloader from '../burnerloader.gif';
export  default ({total, dollarDisplay, ens, title, titleImage, mainStyle, balance, address, changeView, view}) => {


  let sendButtonOpacity = 1.0
  if(view=="receive"){
    sendButtonOpacity = 0
  }



  let name = ens
  if(!name){
    name = address.substring(2,8)
  }

  let moneyDisplay
  let blockieDisplay
  if(typeof total == "undefined" || Number.isNaN(total)){
    moneyDisplay = (
      <div style={{opacity:0.2}}>
        loading...
      </div>
    )
    blockieDisplay = (
      <div>
        <img src ={burnerloader} style={{maxHeight:50,opacity:0.25,marginLeft:-20}}/>
      </div>
    )
  }else{
    moneyDisplay = (
      <div>
        ${dollarDisplay(total)}
      </div>
    )
    if(view=="main"){
      blockieDisplay = (
        <a href={"https://blockscout.com/poa/dai/address/"+address+"/transactions"} target="_blank" style={{color:"#FFFFFF"}}>
          <Blockie
            address={address}
            config={{size:6}}
           />
        </a>
      )
    }else{
      blockieDisplay = (
        <a href={"/"} style={{color:"#FFFFFF"}}>
          <Blockie
            address={address}
            config={{size:6}}
           />
        </a>
      )
    }

  }

  let scanButtonStyle = {
    opacity:sendButtonOpacity,
    position:"fixed",
    right:20,
    bottom:20,
    zIndex:2,
    cursor:"pointer"
  }

  if(view=="send_to_address"){
    scanButtonStyle.position = "absolute"
    scanButtonStyle.right = -3
    scanButtonStyle.top = 217
    delete scanButtonStyle.bottom
  }

  let bottomRight = (
    <div style={scanButtonStyle} onClick={() => changeView('send_by_scan')} >
      <div style={{position:'relative',backgroundImage:"linear-gradient("+mainStyle.mainColorAlt+","+mainStyle.mainColor+")",backgroundColor:mainStyle.mainColor,borderRadius:"50%",width:82,height:82,boxShadow: "0.5px 0.5px 5px #000000"}}>
        <a href="#" style={{color:'#FFFFFF',position:'absolute',left:27,top:24}}>
          <i className="fas fa-qrcode" />
        </a>
      </div>
    </div>
  )

  let topLeft = (
    <div style={{zIndex:-2,position:"absolute",left:14,top:4,zIndex:1,cursor:"pointer"}}  >
      {blockieDisplay} <div style={{position:"absolute",left:60,top:15,fontSize:14}}>{name}</div>
    </div>
  )

  let topRight = (
    <div style={{zIndex:-2,position:"absolute",right:28,top:-4,zIndex:1,fontSize:46}}  >
      {moneyDisplay}
    </div>
  )


  return (
    <div className="header">
      {topLeft}
      {topRight}
      {bottomRight}
    </div>
  )
};
