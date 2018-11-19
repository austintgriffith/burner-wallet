import React from 'react';

export default class Claimed extends React.Component {
    constructor(props) {
      super(props);
    }

    render() {
      let element = "";

      if(this.props.claimed){
        element = (
            <div key={"claimedui"} style={{clear:'both',borderTop:"1px solid #cccccc",width:'100%',textAlign:'center',margin:'0 auto !important'}}>
              Claimed!!!
            </div>
        )
      }

      return element;
    }
}
