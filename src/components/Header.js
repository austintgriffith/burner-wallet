import React from 'react';
import { Scaler, Blockie } from "dapparatus";
export  default ({ens, title, titleImage, mainStyle, balance, address, changeView, view}) => {

  let sendButtonOpacity = 1.0
  if(view=="send_to_address"){
    sendButtonOpacity = 0
  }

  let bottomRight = (
    <div style={{opacity:sendButtonOpacity,position:"fixed",right:20,bottom:20,zIndex:2,cursor:"pointer"}} onClick={() => changeView('send_by_scan')} >
      <div style={{position:'relative',backgroundImage:"linear-gradient("+mainStyle.mainColorAlt+","+mainStyle.mainColor+")",backgroundColor:mainStyle.mainColor,borderRadius:"50%",width:82,height:82,boxShadow: "0.5px 0.5px 5px #000000"}}>
        <a href="#" style={{color:'#FFFFFF',position:'absolute',left:27,top:24}}>
          <i className="fas fa-qrcode" />
        </a>
      </div>
    </div>
  )

  let topRight = (
    <div className={"topBlockie"} style={{zIndex:-2,position:"absolute",right:80,top:4,zIndex:1,cursor:"pointer"}}  >
      <a href={"https://blockscout.com/poa/dai/address/"+address+"/transactions"} target="_blank" style={{color:"#FFFFFF"}}>
        <Blockie
          address={address}
          config={{size:3}}
         />
      </a>
    </div>
  )


  return (
    <div className="header">
      {topRight}
      {bottomRight}
    </div>
  )
};
