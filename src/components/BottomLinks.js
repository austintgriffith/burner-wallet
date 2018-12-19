import React from 'react';
import { Scaler } from "dapparatus";
export default () => {
  return (
    <div className="text-center bottom-text" style={{marginBottom:30}}>
      <Scaler config={{startZoomAt:380,origin:"0% 50%",adjustedZoom:1}}>
        <span style={{padding:10,whiteSpace:"nowrap"}}>
          <a href="https://github.com/austintgriffith/burner-wallet" style={{color:"#FFFFFF"}} target="_blank">
            <i className="fas fa-code"/> Code
          </a>
        </span>
        <span style={{padding:10,whiteSpace:"nowrap"}}>
          <a href="https://twitter.com/austingriffith" target="_blank" style={{color:"#FFFFFF"}}>
            <i className="fas fa-comment"/> Feedback
          </a>
        </span>
        <span style={{padding:10,whiteSpace:"nowrap"}}>
          <a href="https://medium.com/gitcoin/ethereum-in-emerging-economies-b235f8dac2f2" style={{color:"#FFFFFF"}} target="_blank">
            <i className="fas fa-info-circle"/> About
          </a>
        </span>
      </Scaler>
    </div>
  )
};
