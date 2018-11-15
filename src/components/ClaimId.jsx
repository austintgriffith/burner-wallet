import React from 'react';

export default class ClaimId extends React.Component {
    constructor(props) {
      super(props);
    }

    render() {
      let element = "";

      if(this.props.claimId){
        element = (
          <div key={"claimui"} style={{clear:'both',borderTop:"1px solid #cccccc",width:'100%',textAlign:'center',margin:'0 auto !important'}}>
            Claiming {this.props.claimId}...
          </div>
        )
      }

      return element;
    }
}
