import React from 'react';
import Blockies from 'react-blockies';
import Loader from './Loader';
import { Scaler } from "dapparatus";

export  default ({totalFunds, noimage, mainStyle, setLoading, loading, isLoading, buttonStyle, contracts, tx, force, emojiIndex, icon, text, selected, amount, address, dollarDisplay}) => {

  let lbar = ""
  if(loading){
    lbar =  (
      <div style={{position:'absolute',left:-7,top:0,width:"100%",height:39,backgroundColor:"#DDDDDD",opacity:0.79}}>
        <div>
          <Loader noimage={noimage} loaderImage={""} mainStyle={mainStyle}/>
        </div>
      </div>
    )
  }

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

  let actionButtons = ""
  if(force){
    opacity=1
    let displayText = parseFloat(text)*2
    let amountItCosts = displayText
    //console.log("text",text,"displayText",displayText,"amountItCosts",amountItCosts,"vs totalFunds ",totalFunds)

    actionButtons = (
      <div>
        <div className="content ops row"  >

          <div className="col-5">
            <button className="btn btn-large w-100" disabled={amountItCosts>totalFunds} onClick={() => {
              console.log("BUY")
              setLoading(emojiIndex,true)
              tx(
                //function buyEmoji(uint8 index)
                contracts.ERC20Vendable.buyEmoji(emojiIndex)
                ,100000,0,0,(receipt)=>{
                  if(receipt){
                    console.log("DONE WITH BUY EMOJI?")
                    setLoading(emojiIndex,false)
                  }
                }
              )
            }} style={buttonStyle.secondary}>
              <Scaler config={{startZoomAt:400,origin:"50% 50%"}}>
                <div style={{fontSize:20}}>
                  Buy
                </div>
              </Scaler>
            </button>
          </div>
          <div className="col-5" style={{marginLeft:5}}>
            <button className="btn btn-large w-100" disabled={parseInt(amount)<=0} onClick={() => {
              console.log("SELL")
              setLoading(emojiIndex,true)
              tx(
                //function buyEmoji(uint8 index)
                contracts.ERC20Vendable.sellEmoji(emojiIndex)
                ,100000,0,0,(receipt)=>{
                  if(receipt){
                    console.log("DONE WITH BUY EMOJI?")
                    setLoading(emojiIndex,false)
                  }
                }
              )
            }} style={buttonStyle.secondary}>
              <Scaler config={{startZoomAt:400,origin:"50% 50%"}}>
                <div style={{fontSize:20}}>
                  Sell
                </div>
              </Scaler>
            </button>
          </div>
          <div className="col-1">
          </div>
        </div>
      </div>
    )

  }

  //console.log("icon",icon)

  if(typeof icon == "string" && icon.length<8){
    let displayText = text
    if(parseFloat(displayText)>0.01){
      displayText="$"+(displayText*2)
    }
    return (
      <div className="balance row" style={{opacity,paddingBottom:0,paddingLeft:20}}>





        <div className="avatar col p-0">
            {lbar}

          <div style={{maxWidth:50,maxHeight:50,fontSize:45,paddingTop:9}}>

            {icon}
            <div style={{position:'absolute',left:60,top:12,fontSize:14,opacity:0.77}}>
              {displayText}
            </div>
            <div>

            </div>
          </div>

        </div>

<div className="avatar col p-0" style={{width:"50%"}}>
        <div style={{position:"absolute",left:"35%",top:0,width:260}}>
          {actionButtons}
        </div>

</div>

        <div style={{position:"absolute",right:25,marginTop:9}}>
          <Scaler config={{startZoomAt:400,origin:"200px 30px",adjustedZoom:1}}>
            <div>
              <div style={{fontSize:40,letterSpacing:-2}}>
                {dollarDisplay(amount)}
              </div>
            </div>
          </Scaler>
        </div>
      </div>
    )
  }else{
    return (
      <div className="balance row" style={{opacity,paddingBottom:0,paddingLeft:20}}>
        <div className="avatar col p-0">
          <img src={icon} style={{maxWidth:50,maxHeight:50}}/>
          <div style={{position:'absolute',left:60,top:12,fontSize:14,opacity:0.77}}>
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
  }


};
