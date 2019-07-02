import React from 'react';
import { Flex, Text, Image } from "rimble-ui";

export  default ({icon, text, selected, amount, currencyDisplay}) => {

  let opacity = 1
  if(text === selected){
    opacity=0.95
  }

  if(isNaN(amount) || typeof amount === "undefined"){
    amount = 0.00
    opacity = 0.25
  }

  return (
    <div style={{opacity}}>
      <Flex justifyContent={"space-between"} alignItems={"center"} borderBottom={1} borderColor={"#DFDFDF"} mb={3} pb={3}>
        <Flex alignItems={"center"}>
          <Image src={icon} height={"50px"} width={"50px"} mr={3} bg="transparent" />
          <Text>
            {text}
          </Text>
        </Flex>

        <Text fontSize={4}>
          {currencyDisplay(amount)}
        </Text>
      </Flex>
    </div>
  )
};
