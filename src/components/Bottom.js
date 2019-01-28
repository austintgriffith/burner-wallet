import React from 'react';
import i18n from '../i18n';

export default class Receive extends React.Component {
  render() {
    let {icon,text,action} = this.props

    if(!icon) icon = "times"
    if(!text) text = i18n.t('done')

    icon = "fas fa-"+icon

    return (
      <div name="theVeryBottom" className="text-center bottom-text" style={{marginBottom:20}}>
        <span style={{padding:59}}>
          <button className={"btn btn-large w-50"} style={{backgroundColor:"#666666",color:"#FFFFFF",padding:10,whiteSpace:"nowrap"}} onClick={()=>{action()}}>
            <i className={icon}/> {text}
          </button>
        </span>
      </div>
    )
  }
}
