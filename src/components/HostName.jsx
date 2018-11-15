import React from 'react';


export default class HostName extends React.Component {

    render() {
      return (
        <div style={{cursor:"pointer",position:'absolute',left:5,top:0,letterSpacing:-0.8,fontSize:50}}
          onClick={()=>{window.location = "/"}}
        >
          {window.location.hostname}
        </div>
      );
    }
}
