import React from 'react';
import { Scaler, Blockie } from "dapparatus";
export  default ({ens, title, titleImage, mainStyle, balance, address, changeView, view}) => {
  let actionWord = "Send"
  if(balance<=0){
    actionWord = "Scan"
  }

  let sendButtonOpacity = 1.0
  if(view=="send_to_address"){
    sendButtonOpacity = 0
  }

  let topRight = (
    <div style={{opacity:sendButtonOpacity,position:"fixed",right:20,top:6,zIndex:1,cursor:"pointer"}} onClick={() => changeView('send_by_scan')} >
      <button className="btn btn-large w-100" style={{paddingTop:8,backgroundColor:"#FFFFFF",border:"3px solid "+mainStyle.mainColor}}>
        <a href="#" style={{color:mainStyle.mainColor}}>
          <span style={{paddingRight:10,fontSize:22}}>
            {actionWord}
          </span>
          <i className="fas fa-camera" />
        </a>
      </button>
    </div>
  )
  if(view=="bridge"){

    let display = address
    if(ens){
      display = ens
    }

    topRight = (
      <div style={{position:"absolute",right:0,top:-10,zIndex:1,cursor:"pointer"}}  >
        <a href={"https://blockscout.com/poa/dai/address/"+address+"/transactions"} target="_blank" style={{color:"#FFFFFF"}}>
        <Scaler config={{startZoomAt:1000,origin:"100% 100%",adjustedZoom:1}}>
        <div style={{position:"absolute",right:70,top:20}}>
          {display}
        </div>
        <div style={{marginTop:17,marginRight:10}}>
          <Blockie
            address={address}
            config={{size:7}}
           />
        </div>
        </Scaler>
        </a>
      </div>
    )
  }



  return (
    <div className="header">
      <Scaler config={{startZoomAt:600,origin:"0% 0%",adjustedZoom:1}}>
        <a href="#" style={{color:"#FFFFFF"}} onClick={()=>{
          changeView('main')
        }}>
          {titleImage}
          <span style={{paddingLeft:10}}>{title}</span>
        </a>
      </Scaler>
      {topRight}
    </div>
  )
};
