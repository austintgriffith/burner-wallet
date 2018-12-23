import React from 'react';
import Blockies from 'react-blockies';
import { Scaler } from "dapparatus";

export  default ({amount, address}) => {
  let displayAmount = ""
  if(typeof amount == "number"){
    displayAmount = amount.toFixed(2)
  }
  return (
    <div className="balance content row">
      <div className="avatar col p-0">
        <a href={"https://blockscout.com/poa/dai/address/"+address+"/transactions"} target="_blank">
          <Blockies seed={address} scale={10}/>
        </a>
      </div>
      <div style={{position:"absolute",right:10,marginTop:15}}>
        <Scaler config={{startZoomAt:400,origin:"200px 30px",adjustedZoom:1}}>
          <div style={{fontSize:64,letterSpacing:-2,fontWeight:750}}>
            ${displayAmount}
          </div>
        </Scaler>
      </div>
    </div>
  )
};
