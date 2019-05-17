import React from 'react';
import Blockies from 'react-blockies';
import { Scaler } from "dapparatus";
let base64url = require('base64url')

export  default ({pk, web3, icon, text, selected, amount, address, dollarDisplay}) => {

  let opacity = 0.65
  if(text == selected){
    opacity=0.95
  }

  if(isNaN(amount) || typeof amount == "undefined"){
    amount=0.00
    opacity=0.25
  }

  if(opacity<0.9 && parseFloat(amount)<=0.0){
    opacity=0.05
  }

  let iconDisplay

    if(typeof icon == "string" && icon.length<8){
    iconDisplay = (
      <div style={{width:50,height:50,fontSize:42,paddingTop:13}}>
        {icon}
      </div>
    )
  }else{
    iconDisplay = <img src={icon} style={{maxWidth:50,maxHeight:50}}/>
  }



  if(icon=="🤑"){
    if(pk){
      let endcodedPk = base64url(web3.utils.hexToBytes(pk))
      let pkLink = "https://emojicoin.exchange/pk#"+endcodedPk
      return (
        <div className="balance row" style={{opacity,paddingBottom:0,paddingLeft:20}}>
          <div className="avatar col p-0">
            {iconDisplay}
            <div style={{position:'absolute',left:60,top:12,fontSize:14,opacity:0.77,color:"#FF51EE"}}>
            </div>
          </div>
          <div style={{position:"absolute",right:25,marginTop:15}}>
            <Scaler config={{startZoomAt:400,origin:"200px 30px",adjustedZoom:1}}>
              <div style={{fontSize:20,letterSpacing:-2}}>
                <a href={pkLink} target="_blank">
                 Play Emojicoin Exchange  <i style={{paddingLeft:5}} className="fas fa-chart-line"/>
                </a>
              </div>
            </Scaler>
          </div>
        </div>
      )
    }
  }


  return (
    <div className="balance row" style={{opacity,paddingBottom:0,paddingLeft:20}}>
      <div className="avatar col p-0">
        {iconDisplay}
        <div style={{position:'absolute',left:60,top:12,fontSize:14,opacity:0.77,color:"#FF51EE"}}>
          {text}
        </div>
      </div>
      <div style={{position:"absolute",right:25,marginTop:15}}>
        <Scaler config={{startZoomAt:400,origin:"200px 30px",adjustedZoom:1}}>
          <div style={{fontSize:40,letterSpacing:-2}}>
            {dollarDisplay(amount)}
          </div>
        </Scaler>
      </div>
    </div>
  )
};
