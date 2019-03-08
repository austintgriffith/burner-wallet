import React from 'react';
import Ruler from "./Ruler";
import { Scaler } from "dapparatus";
import { Text, Flex, Button, Link, TextButton, Box } from "rimble-ui";
import theme from "../theme.js";

export  default ({title,titleLink, goBack, darkMode}) => {

  let titleDisplay = ""

  if(titleLink){
    titleDisplay = (
      <Link href={titleLink} target="_blank" textAlign="center" fontSize={[3,3,3]}>
        {title}
      </Link>
    )
  }else{
    titleDisplay = (
      <Text textAlign="center" fontSize={[3,3,3]}>
        {title}
      </Text>
    )
  }

  return (
      <Box borderBottom={1} borderColor={"#E8E8E8"} mb={2} pb={3}>
        <TextButton
          icononly
          icon={'Close'}
          color={'moon-gray'}
          position={'absolute'}
          top={0}
          right={0}
          mt={3}
          mr={3}
          zIndex={99}
          onClick={()=>{console.log("CLICKED");goBack()}}
        />

        {titleDisplay}

      </Box>
  )
};
