import React from 'react';
import { Scaler, Blockie } from "dapparatus";
export  default ({ens, title, titleImage, mainStyle, balance, address, changeView, view}) => {

  let sendButtonOpacity = 1.0
  if(view=="send_to_address"){
    sendButtonOpacity = 0
  }

  let bottomRight = (
    <div style={{opacity:sendButtonOpacity,position:"fixed",right:20,bottom:20,zIndex:1,cursor:"pointer"}} onClick={() => changeView('send_by_scan')} >
      <div style={{position:'relative',backgroundImage:"linear-gradient("+mainStyle.mainColorAlt+","+mainStyle.mainColor+")",backgroundColor:mainStyle.mainColor,borderRadius:"50%",width:82,height:82,boxShadow: "0.5px 0.5px 5px #000000"}}>
        <a href="#" style={{color:'#FFFFFF',position:'absolute',left:27,top:24}}>
          <i className="fas fa-qrcode" />
        </a>
      </div>
    </div>
  )

  let topRight = (
    <div style={{position:"absolute",right:0,top:-10,zIndex:1,cursor:"pointer"}}  >
      <a href={"https://blockscout.com/poa/dai/address/"+address+"/transactions"} target="_blank" style={{color:"#FFFFFF"}}>
      <Scaler config={{startZoomAt:400,origin:"50% 50%",adjustedZoom:1}}>
      <div style={{marginTop:18,marginRight:10}}>
        <Blockie
          address={address}
          config={{size:6}}
         />
      </div>
      </Scaler>
      </a>
    </div>
  )


  return (
    <div className="header">
      <Scaler config={{startZoomAt:400,origin:"50% 50%",adjustedZoom:1}}>
        <a href="#" style={{color:"#FFFFFF"}} onClick={()=>{
          changeView('main')
        }}>
          {titleImage}
          <span style={{paddingLeft:10}}>{title}</span>
        </a>
      </Scaler>
      {topRight}
      {bottomRight}
    </div>
  )
};
