import React from 'react';
import i18n from '../i18n';
import { Box, Button, Flex, Icon, Text } from 'rimble-ui'

export default class Receive extends React.Component {
  render() {
    let {icon,text,action} = this.props

    if(!icon) icon = "times"
    if(!text) text = i18n.t('done')

    icon = "fas fa-"+icon

    return (
      <Box name="theVeryBottom" mb={4} textAlign={'center'}>
        <Button onClick={()=>{action()}} bg={'mid-gray'}>
          <Flex alignItems="center">
            <Box mr={2}>
              <i className={icon}/>
            </Box>
            
            <Text color={'white'}>{text}</Text>
          </Flex>
        </Button>
      </Box>
    )
  }
}
