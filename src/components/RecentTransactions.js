import React from 'react';
import { Blockie } from "dapparatus";
import Ruler from "./Ruler";
import {CopyToClipboard} from "react-copy-to-clipboard";

const BockieSize = 4

export default ({account, recentTxs}) => {
  recentTxs = recentTxs.reverse().slice(0,12)
  let txns = []
  for(let r in recentTxs){
    if(txns.length>0){
      txns.push(
        <hr key={"ruler"+recentTxs[r].hash} style={{ "color": "#DFDFDF",marginTop:0,marginBottom:7 }}/>
      )
    }
    txns.push(
      <div key={recentTxs[r].hash} className="content bridge row">
        <div className="col-5 p-1" style={{textAlign:'right'}}>
          <Blockie
            address={recentTxs[r].from}
            config={{size:BockieSize}}
          />
        </div>
        <div className="col-2 p-1" style={{textAlign:'center'}}>
          <span style={{opacity:0.33}}>-</span>${parseFloat(recentTxs[r].value).toFixed(2)}<span style={{opacity:0.33}}>-></span>
        </div>
        <div className="col-5 p-1" style={{textAlign:'left'}}>
          <Blockie
            address={recentTxs[r].to}
            config={{size:BockieSize}}
          />
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
