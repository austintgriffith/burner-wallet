import React from 'react';
import Blockies from 'react-blockies';
import { Scaler } from "dapparatus";
import { Flex, Text, Box, Image } from "rimble-ui";

export  default ({icon, text, selected, amount, address, dollarDisplay}) => {

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


  return (
    <Flex justifyContent={"space-between"} alignItems={"center"} borderBottom={1} borderColor={"#DFDFDF"} mb={3} pb={3}>
      <Flex alignItems={"center"}>
        <Image src={icon} height={"50"} width={"50"} mr={3} bg="white" />

        <Text>
          {text}
        </Text>
      </Flex>

      <Text fontSize={4}>
        {dollarDisplay(amount)}
      </Text>
    </Flex>
  )
};
