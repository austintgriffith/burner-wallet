import React from 'react';
import { Scaler } from "dapparatus";

export  default ({title, goBack}) => {
  return (
    <div className="nav-card card">
      <div className="row">

        <div style={{position:'absolute',left:10,fontSize:42,top:0,cursor:'pointer',zIndex:1,padding:3}} onClick={()=>{console.log("CLICKED");goBack()}}>
          <i className="fas fa-arrow-left" />
        </div>

        <div style={{textAlign:"center",width:"100%",fontSize:22}}>
          <Scaler config={{startZoomAt:500,origin:"80% 50%",adjustedZoom:1}}>
            {title}
          </Scaler>
        </div>

      </div>
    </div>
  )
};
