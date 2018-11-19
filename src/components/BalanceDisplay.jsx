import React from 'react';

export default class BalanceDisplay extends React.Component {
    constructor(props) {
      super(props);
    }

    render() {
      let balanceDiv = "";
      let balanceDisplay  = this.props.balance //Math.round(this.state.balance*100,2)/100
      let network = this.props.network;
      let moneytype = this.props.moneytype;

      if(balanceDisplay){
        balanceDisplay = balanceDisplay.toFixed(2)
      }else{
        balanceDisplay = "0.00"
      }

      if(network === "xDai" || network === "Unknown" ){
        balanceDiv = (
          <div key={"test1"} style={{clear:'both',borderTop:"1px solid #cccccc"}}>
            <div key={"test1a"} style={{width:"100%",marginLeft:-12,textAlign:"center",fontSize:70,letterSpacing:-2,padding:10,marginBottom:5,marginBottom:5}}>
              {moneytype}{balanceDisplay}
            </div>
          </div>)
      }else{
        balanceDiv = (
          <div key={"test2"} style={{clear:'both',border:"1px solid #ffeeee",backgroundColor:"#eedddd",padding:40}}>
            <div key={"test2a"} style={{width:"100%",color:"#665555",marginLeft:-12,textAlign:"center",fontSize:20,padding:10,marginBottom:5,marginBottom:5}}>
              {"Wrong Network: Please use 'Custom RPC' endpoint: https://dai.poa.network"}
            </div>
          </div>
        )
      }

      return balanceDiv;
    }
}
/*




*/
