import React from 'react';
import { Flex, Text, Image } from "rimble-ui";

export  default ({icon, text, amount, currencyDisplay}) => {

  let opacity = 1

  if(isNaN(amount)){
    opacity = 0.25
  }

  return (
    <Flex opacity={opacity} justifyContent={"space-between"} alignItems={"center"} borderBottom={1} borderColor={"#DFDFDF"} mb={3} pb={3}>
      <Flex alignItems={"center"}>
        <Image src={icon} height={"50px"} width={"50px"} mr={3} bg="transparent" />
        <Text>
          {text}
        </Text>
      </Flex>

      <Text fontSize={4}>
        
      {/* NOTE: Sometimes the exchangeRate to fiat wasn't loaded yet and hence
        * amount can become NaN. In this case, we simply pass 0 to
        *  currencyDisplay.*/}
        {isNaN(amount) ? currencyDisplay(0) : currencyDisplay(amount)}
      </Text>
    </Flex>
  )
};
