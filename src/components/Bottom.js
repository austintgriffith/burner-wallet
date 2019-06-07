import React from 'react';
import i18n from '../i18n';
import { Icon } from 'rimble-ui'
import { ActionButton } from '../components/Buttons'

export default class Receive extends React.Component {
  render() {
    let {icon,text,action} = this.props

    if(!icon) icon = "times"
    if(!text) text = i18n.t('done')

    //icon = "fas fa-"+icon

    return (
      <div name="theVeryBottom" className="text-center bottom-text" style={{marginBottom:20}}>
        <ActionButton onClick={()=>{action()}}>
            <Icon name={icon} mr={2} />
            {text}
        </ActionButton>
      </div>
    )
  }
}
