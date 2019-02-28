import React from 'react';
import Blockies from 'react-blockies';
import { Scaler } from "dapparatus";
import { Flex, Text } from "rimble-ui";

export  default ({icon, text, selected, amount, address, dollarDisplay}) => {

  let opacity = 0.65
  if(text == selected){
    opacity=0.95
  }

  if(isNaN(amount) || typeof amount == "undefined"){
    amount=0.00
    opacity=0.25
  }

  return (
    <Flex>
      <div className="avatar col p-0">
        <img src={icon} style={{maxWidth:50,maxHeight:50}}/>
        <div style={{position:'absolute',left:60,top:12,fontSize:14,opacity:0.77}}>
          {text}
        </div>
      </div>
      <div>
        <Text>
          ${dollarDisplay(amount)}
        </Text>
      </div>
    </Flex>
  )
};
