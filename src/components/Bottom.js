import React from 'react';
import i18n from '../i18n';
import BackButton from './BackButton';

const buttonStyle = {
  backgroundColor:"#666666",
  color:"#FFFFFF",
  padding:10,
  whiteSpace:"nowrap",
};

const Bottom = ({ icon, text, action }) => (
  <div name="theVeryBottom" className="text-center bottom-text" style={{marginBottom:20, cursor: "pointer"}}>
    <span style={{padding:59}}>
      {action ? (
        <button className={"btn btn-large w-50"} style={buttonStyle} onClick={action}>
          <i className={`fas fa-${icon}`}/> {text}
        </button>
      ) : (
        <BackButton className={"btn btn-large w-50"} style={buttonStyle}>
          <i className={`fas fa-${icon}`}/> {text}
        </BackButton>
      )}
    </span>
  </div>
)

Bottom.defaultProps = {
  icon: 'times',
  text: i18n.t('done'),
};

export default Bottom;
