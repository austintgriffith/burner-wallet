import React from 'react';
import { Blockie } from "dapparatus";
import burnerloader from '../assets/burnerloader.gif';
import { Icon } from "rimble-ui";
export  default ({openScanner, network, total, ens, address, changeView, view}) => {


  let sendButtonOpacity = 1.0
  if(view==="receive" || view==="send_badge"){
    sendButtonOpacity = 0
  }



  let name = ens
  if(!name){
    name = address.substring(2,8)
  }

  let moneyDisplay
  let blockieDisplay
  if(typeof total == "undefined" || Number.isNaN(total)){
    moneyDisplay = (
      <div className={"money_display__connecting"}>
        Connecting..
      </div>
    )
    blockieDisplay = (
      <img src={burnerloader} className="blockie__loader" alt=""/>
    )
  }else{
    /*moneyDisplay = (
      <div>
        {dollarDisplay(total)}
      </div>
    )*/
    moneyDisplay = (
      <div className="money_display__network">
        {network}
      </div>
    )
    blockieDisplay = (
      <Blockie
          address={address}
          config={{size:6}}>
      </Blockie>
    )
  }

  let scanButtonStyle = {
    opacity:sendButtonOpacity,
    position:"fixed",
    zIndex:2,
  }

  if(view==="send_to_address"){
    scanButtonStyle.position = "absolute"
    scanButtonStyle.right = -3
    scanButtonStyle.top = 217
    delete scanButtonStyle.bottom
  }

  let bottomRight = (
    <div className={"fab_container"} style={scanButtonStyle}  >
      <button className={"fab_button"}
        onClick={() => {
          openScanner({view:"send_to_address"})
        }}
      >
        <Icon name="CenterFocusWeak" className="fab_icon--capture"/>
      </button>
    </div>
  )

  const mainOrExchange = view === "main" || view === "exchange";
  const opacity =mainOrExchange ? 1 :  0.5;
  const blockieLink = mainOrExchange ? 'receive' : 'main';
  let topLeft = (
    <div className={"blockie_container"} onClick={() => changeView(blockieLink)}>
      {blockieDisplay}
      <div className="blockie_container__name">{name}</div>
    </div>);


  let topRight = (
    <div className={"money_display"} >
      {moneyDisplay}
    </div>
  )


  return (
    <div className="header" style={{opacity, zIndex: 5}}>
      {topLeft}
      {topRight}
      {view === "main" ?  bottomRight : null}
    </div>
  )
};
