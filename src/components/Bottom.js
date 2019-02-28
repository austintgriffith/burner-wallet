import React from 'react';
import i18n from '../i18n';
import { Button, Flex, Icon } from 'rimble-ui'

export default class Receive extends React.Component {
  render() {
    let {icon,text,action} = this.props

    if(!icon) icon = "times"
    if(!text) text = i18n.t('done')

    //icon = "fas fa-"+icon

    return (
      <div name="theVeryBottom" className="text-center bottom-text" style={{marginBottom:20}}>
        <Button onClick={()=>{action()}}>
          <Flex alignItems="center">
<<<<<<< HEAD
            <Icon name={icon} mr={2} />
=======
            <Icon name={icon} />
>>>>>>> Adding rimble and starting to swap out components.
            {text}
          </Flex>
        </Button>
      </div>
    )
  }
}
