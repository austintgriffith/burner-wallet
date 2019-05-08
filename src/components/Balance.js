import React from 'react';
import Blockies from 'react-blockies';
import { Scaler } from "dapparatus";

import {Flex, Box, Text} from 'rimble-ui'

export default ({icon, text, selected, amount, address, dollarDisplay}) => {

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

  if(typeof icon == "string" && icon.length<8) {
    iconDisplay = (
      <div style={{width:50,height:50,fontSize:42,lineHeight:1,paddingTop:6}}>
        {icon}
      </div>
    )
  }else{
    iconDisplay = (
      <img src={icon} style={{maxWidth:50,maxHeight:50}}/>
    )

  }


  return (
    <div className="balance" style={{opacity}}>
      <Flex width={1} pr={3} pl={2} alignItems={'center'} >
        <Box>
          {iconDisplay}
        </Box>
        <Text fontSize={2}>
          {text}
        </Text>
        <Text mr={0} ml={'auto'} fontWeight={2} fontSize={'40px'}>
          {dollarDisplay(amount)}
        </Text>
      </Flex>
    </div>
  )
};
