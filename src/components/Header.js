import React from 'react';
import { Scaler, Blockie } from "dapparatus";
import burnerloader from '../burnerloader.gif';
export  default ({openScanner, network, total, dollarDisplay, ens, title, titleImage, mainStyle, balance, address, changeView, view}) => {


  let sendButtonOpacity = 1.0
  if(view=="receive" || view=="send_badge"){
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
      <div style={{opacity:0.1,fontSize:28,paddingTop:15}}>
        connecting...
      </div>
    )
    blockieDisplay = (
      <div>
        <img src ={burnerloader} style={{maxHeight:50,opacity:0.25,marginLeft:-20}}/>
      </div>
    )
  }else{
    /*moneyDisplay = (
      <div>
        {dollarDisplay(total)}
      </div>
    )*/
    moneyDisplay = (
      <div style={{opacity:0.4,fontSize:22,paddingTop:18}}>
        {network}
      </div>
    )
    blockieDisplay = (
      <Blockie
          address={address}
          config={{size:6}}>
      </Blockie>
    )
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
    <div style={scanButtonStyle} onClick={() => {
      openScanner({view:"send_to_address"})
    }} >
      <div style={{position:'relative',backgroundImage:"linear-gradient("+mainStyle.mainColorAlt+","+mainStyle.mainColor+")",backgroundColor:mainStyle.mainColor,borderRadius:"50%",width:100,height:100,boxShadow: "0.5px 0.5px 5px #000000"}}>
        <a href="#" style={{color:'#FFFFFF',position:'absolute',left:26,top:26}}>
          <svg p="3" display="block" class="sc-ipXKqB enlWbz" viewBox="0 0 24 24" width="50" height="50" fill="currentcolor"><path d="M5 15H3v4c0 1.1.9 2 2 2h4v-2H5v-4zM5 5h4V3H5c-1.1 0-2 .9-2 2v4h2V5zm14-2h-4v2h4v4h2V5c0-1.1-.9-2-2-2zm0 16h-4v2h4c1.1 0 2-.9 2-2v-4h-2v4zM12 8c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm0 6c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z"></path></svg>
        </a>
      </div>
    </div>
  )

  let opacity = 0.5



  let topLeft

  if(view=="main" || view=="exchange"){
    opacity = 1.0
    topLeft = (
      <div style={{zIndex:-2,position:"absolute",left:16,top:4,zIndex:1,cursor:"pointer"}}  >
        <a href={"https://blockscout.com/poa/dai/address/"+address+"/transactions"} target="_blank" style={{color:"#000000"}}>
          {blockieDisplay} <div style={{position:"absolute",left:60,top:15,fontSize:14}}>{name}</div>
        </a>
      </div>
    )
  }else{
    topLeft = (
      <div style={{zIndex:-2,position:"absolute",left:16,top:4,zIndex:1,cursor:"pointer"}} onClick={() => changeView('main')} >
          {blockieDisplay} <div style={{position:"absolute",left:60,top:15,fontSize:14}}>{name}</div>
      </div>
    )
  }

  let topRight = (
    <div style={{zIndex:-2,position:"absolute",right:28,top:-4,zIndex:1,fontSize:46,opacity:0.9}}  >
      {moneyDisplay}
    </div>
  )


  return (
    <div className="header" style={{opacity,color:'#000000'}}>
      {topLeft}
      {topRight}
      {bottomRight}
    </div>
  )
};
