import React from 'react';
import {
  Text,
  Link,
  Icon,
  Flex
} from "rimble-ui";

export default ({title, titleLink, goBack, darkMode}) => {

  let titleDisplay = ""

  if (titleLink){
    titleDisplay = (
      <Link href={titleLink} target="_blank" textAlign={'center'} fontSize={3}>
        {title}
      </Link>
    )
  } else {
    titleDisplay = (
      <Text textAlign={'center'} fontSize={3}>
        {title}
      </Text>
    )
  }

  return (
    <Flex
      position={'relative'}
      alignItems={'center'}
      justifyContent={'center'}
      borderBottom={1}
      borderColor={'moon-gray'}
      height={'3rem'}
      mb={3}
      pb={3}
    >
      {titleDisplay}
      <Flex
        position={'absolute'}
        alignItems={'center'}
        justifyContent={'center'}
        color={'moon-gray'}
        size={'3rem'}
        right={'-0.5rem'}
        onClick={()=>{console.log("CLICKED");goBack()}}
      >
        <Icon name={'Close'} />
      </Flex>
    </Flex>
  )
};
