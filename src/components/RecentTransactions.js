import React from 'react';
import { Blockie } from "dapparatus";
import Ruler from "./Ruler";
import {CopyToClipboard} from "react-copy-to-clipboard";
import { Scaler } from "dapparatus";

const BockieSize = 4

export default ({account, recentTxs, block}) => {
  let txns = []
  for(let r in recentTxs){
    if(txns.length>0){
      txns.push(
        <hr key={"ruler"+recentTxs[r].hash} style={{ "color": "#DFDFDF",marginTop:0,marginBottom:7 }}/>
      )
    }
    txns.push(
      <div key={recentTxs[r].hash} className="content bridge row">
        <div className="col-3 p-1" style={{textAlign:'center'}}>
          <Blockie
            address={recentTxs[r].from}
            config={{size:BockieSize}}
          />
        </div>
        <div className="col-3 p-1" style={{textAlign:'center',whiteSpace:"nowrap",letterSpacing:-1}}>
          <Scaler config={{startZoomAt:600,origin:"25% 50%",adjustedZoom:1}}>
            <span style={{opacity:0.33}}>-</span>${parseFloat(recentTxs[r].value).toFixed(2)}<span style={{opacity:0.33}}>-></span>
          </Scaler>
        </div>
        <div className="col-3 p-1" style={{textAlign:'center',whiteSpace:"nowrap",letterSpacing:-1}}>
          <Blockie
            address={recentTxs[r].to}
            config={{size:BockieSize}}
          />
        </div>
        <div className="col-3 p-1" style={{textAlign:'center',whiteSpace:"nowrap",letterSpacing:-1}}>
          <span style={{marginLeft:5,marginTop:-5,opacity:0.4,fontSize:12}}>{cleanTime((block-recentTxs[r].blockNumber)*5)} ago</span>
        </div>
      </div>
    )
  }
  if(txns.length>0){
    return (
      <div className="main-card card w-100">
        {txns}
      </div>
    )
  }else{
    return (
      <span></span>
    )
  }
}

let cleanTime = (s)=>{
  if(s<60){
    return s+"s"
  }else if(s/60<60){
    return Math.round(s/6)/10+"m"
  }else {
    return Math.round((s/60/6)/24)/10+"d"
  }
}
