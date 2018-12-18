import React from 'react';
import { Scaler } from "dapparatus";
export  default ({changeView}) => {
  return (
    <div className="header">
      <Scaler config={{startZoomAt:510,origin:"0% 0%",adjustedZoom:1}}>
        <a href="/" style={{color:"#FFFFFF"}}>
          <i className="fas fa-fire" />
          <span style={{paddingLeft:10}}>Burner Wallet</span>
        </a>
      </Scaler>
      <div style={{position:"fixed",right:20,top:20,zIndex:99,cursor:"pointer"}} onClick={() => changeView('send_by_scan')} >
        <button className="btn btn-large w-100" style={{backgroundColor:"#FFFFFF",border:"2px solid #8762A6"}}>
          <a href="#" style={{color:"#8762A6"}}>
            <span style={{paddingRight:10,fontSize:22,paddingBottom:10}}>
              Send
            </span>
            <i className="fas fa-camera" />
          </a>
        </button>
      </div>
    </div>
  )
};
