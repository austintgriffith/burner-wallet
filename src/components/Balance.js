import React from 'react';
import Blockies from 'react-blockies';
import { Scaler } from "dapparatus";

export  default ({icon, amount, address, dollarDisplay, subDisplay}) => {
  return (
    <div className="balance content row">
      <div className="avatar col p-0">
        <img src={icon} style={{maxWidth:50,maxHeight:50}}/>
      </div>
      <div style={{position:"absolute",right:10,marginTop:15}}>
        <Scaler config={{startZoomAt:400,origin:"200px 30px",adjustedZoom:1}}>
          <div style={{fontSize:40,letterSpacing:-2}}>
            ${dollarDisplay(amount)}
          </div>
          {subDisplay}
        </Scaler>
      </div>
    </div>
  )
};
