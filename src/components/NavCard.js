import React from 'react';

export  default ({title, goBack}) => {
  return (
    <div className="nav-card card">
      <div className="row">

        <div style={{position:'absolute',left:10,fontSize:22,top:15}}>
          <i className="fas fa-arrow-left" onClick={goBack} />
        </div>

        <div style={{textAlign:"center",width:"100%",fontSize:22}}>{title}</div>

      </div>
    </div>
  )
};
