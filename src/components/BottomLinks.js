import React from 'react';
import { Scaler } from "dapparatus";
export default ({changeView}) => {
  return (
    <div className="text-center bottom-text" style={{marginBottom:30}}>
      <Scaler config={{startZoomAt:350,origin:"35% 50%",adjustedZoom:1}}>
        <button className={"btn btn-large w-50"} style={{backgroundColor:"#666666",color:"#FFFFFF",padding:10,whiteSpace:"nowrap"}} onClick={()=>{changeView('advanced')}}>
          <Scaler config={{startZoomAt:400,origin:"50% 50%"}}>
            <i className="fas fa-wrench"/> Advanced
          </Scaler>
        </button>
      </Scaler>
    </div>
  )
};
