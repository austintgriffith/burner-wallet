import React from 'react';

export  default ({changeView}) => {
  return (
    <div className="header">
      <a href="/" style={{color:"#FFFFFF"}}>
        <i className="fas fa-fire" />
        <span>Burner Wallet</span>
      </a>

      <div style={{position:"absolute",right:0,top:6,cursor:"pointer"}} onClick={() => changeView('send_by_scan')} >
        <a href="#" style={{color:"#FFFFFF"}}>
          <span style={{padding:10,fontSize:22,paddingBottom:10}}>
            Send
          </span>
          <i className="fas fa-camera" />
        </a>
      </div>
    </div>
  )
};
