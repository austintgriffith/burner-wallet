import React from 'react';
import i18n from '../i18n';
import { Box, Button, Flex, Icon, Text } from 'rimble-ui'

export default class Receive extends React.Component {
  render() {
    let {icon,text,action} = this.props

    if(!icon) icon = "Close"
    if(!text) text = i18n.t('done')

    // icon = "fas fa-"+icon

    return (
      <Box name="theVeryBottom" my={3} textAlign={'center'}>
        <Button onClick={()=>{action()}} bg={'mid-gray'} icon={icon} px={5}>
          {text}
        </Button>
      </Box>
    )
  }
}
