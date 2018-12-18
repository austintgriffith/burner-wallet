import React from 'react';
import Blockies from 'react-blockies';
import { Scaler } from "dapparatus";

export  default ({amount, address}) => {
  //if(amount>0.01){
    //since it costs a little gas, let's show a penny less when we can
  //  amount=amount-0.01
  //}
  return (
    <div className="balance content row">
      <div className="avatar col p-0">
        <Blockies seed={address} scale={10} />
      </div>
      <div style={{position:"absolute",right:10,marginTop:15}}>
        <Scaler config={{startZoomAt:400,origin:"200px 30px",adjustedZoom:1}}>
          <div style={{fontSize:64,letterSpacing:-2,fontWeight:750}}>
            ${amount.toFixed(2)}
          </div>
        </Scaler>
      </div>
    </div>
  )
};
