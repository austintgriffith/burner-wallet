import React from 'react';
import axios from 'axios';

import eth from '../ethereum.png';
import i18n from '../i18n';

export default class BalanceDisplay extends React.Component {

    constructor(props) {
      super(props);

      this.state = {
        currencyOptions: i18n.t('waiting_for_api'),
        value: "USD",
        rate: '1',
        apiError: false
      }

      this.handleCurrencyChange = this.handleCurrencyChange.bind(this);
    }

    handleCurrencyChange(event) {                                 // Called when user selects local currency
      this.setState({
        value: event.target.value,                                // Name of currency, i.e. GBP
        rate: this.state.rates[event.target.value]                // Rate relative to USD
      });
    }

    componentDidMount(){
      let currencyOptions = [];

      axios.get("https://api.exchangeratesapi.io/latest?base=USD").then((response) => {
        //console.log("Exchange: ", response.data);
        //console.log(typeof(response.data.rates))

        for(var i in response.data.rates){
          //console.log(i + ':' + response.data.rates[i]);
          currencyOptions.push(<option value={i}>{i}</option>)   // All currency options loaded from API
        }

        this.setState({
          rates: response.data.rates,
          currencyOptions: currencyOptions
        });

      }).catch((error)=>{
        console.log('Exchange Error: ' + error);
        this.setState({apiError: true});
      });
    }

    render() {
      let balanceDiv = "";
      let balanceDisplay  = this.props.balance;
      let network = this.props.network;
      let currencyOptions = this.state.currencyOptions;
      let value = this.state.value;
      let rate = this.state.rate;
      let conversion = (balanceDisplay * rate).toFixed(2);

      let currencySelect;

      if(this.state.apiError){
        currencySelect = <div style={{textAlign:"center"}}>{i18n.t('no_currency_api')}</div>
      }else{
        currencySelect = (
          <>
            <div key={"localcurrency"} style={{width:"100%", marginLeft:-12, textAlign:"center", fontSize:30, letterSpacing:-2, padding:10, marginBottom:5}}>
              Select Local Currency:
              <select value={this.state.value} onChange={this.handleCurrencyChange} style={{marginLeft:5, textAlign:"center", fontSize:30, letterSpacing:-2, padding:10, marginBottom:5}}>
                {currencyOptions}
              </select>
            </div>
            <div key={"conversion"} style={{width:"100%", marginLeft:-12, textAlign:"center", fontSize:60, letterSpacing:-2, padding:5, marginBottom:5}}>
              ({value}){conversion}
            </div>
          </>
        );
      }

      let moneytype = (
        <img style={{maxHeight:30,verticalAlign:"middle"}} src={eth}/>
      )
      if(window.location.hostname.indexOf("xdai") >= 0 || window.location.hostname.indexOf("localhost") >= 0){
        moneytype="$"
      }

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
            {currencySelect}
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
