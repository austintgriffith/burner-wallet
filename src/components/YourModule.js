import React from 'react';

import { Events, Blockie, Scaler } from "dapparatus";
import Web3 from 'web3';
import Gnosis from '@frontier-token-research/pm-js/'
import Ruler from "./Ruler";
import axios from "axios"


const YES = 0;
const NO = 1;

const baseDomain = "https://olympia-api.helena.network";
const marketAddress = "0x858c01c4db1b9f4baa7ebc8e14b84138a3f7d207";
const timeInterval = 4500;
const timeTimeOut = 300;

let interval = false

export default class YourModule extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      address: marketAddress,
      odds: [50, 50],
      outcomeTokensSold:[0, 0],
      title: "",
      amount : 0,
    }
  }
  componentDidMount(){
    interval = setInterval(this.pollInterval.bind(this), timeInterval)
    setTimeout(this.pollInterval.bind(this), timeTimeOut)
  }
  componentWillUnmount(){
    clearInterval(interval)
  }

  async pollInterval(){
      const marketInfo = await this.getMarketInfo(this.state.address)
      //console.log("GOT INFO:",marketInfo)
      const outcomeTokensSold = marketInfo.netOutcomeTokensSold
      const title = marketInfo.event.oracle.eventDescription.title
      const odds = marketInfo.marginalPrices;
      this.setState({marketAddress, odds, outcomeTokensSold, title})
  }

  async getMarketInfo(address){
      const response = await fetch(baseDomain +`/api/markets/${address}/`)
      const json = await response.json();
      return json;
  }

  bet(outcome) {
    Gnosis.create(
      {ethereum: this.props.web3.provider}
    ).then(async (result) => {
      const market =  result.contracts.Market.at(this.state.address);
      const cost = Gnosis.calcLMSROutcomeTokenCount(
          this.state.outcomeTokensSold,
          1000e18,
          outcome,
          this.state.amount * 1e18,
          0
      );
      this.props.tx(await market.buy(outcome, cost.toNumber(), 10 * 1e18), 50000, 0, 0);
    })
  }
  render(){
    return (
      <div>
        <div className="form-group w-100">
          <div className="content bridge row">
            <div className="col-12 p-1">
            <div style={{paddingTop:20,textAlign:'center',fontSize:22}}>
              {this.state.title}
            </div>
            </div>
          </div>

          <div className="content row">
            <div className="input-group">
              <input type="text" className="form-control" placeholder="xP+ amount" value={this.state.value}
                onChange={event => this.setState({'amount': event.target.value})}
              />
            </div>
          </div>

          <div className="content bridge row">
            <div className="col-6 p-1">
              <button className="btn btn-large w-100" style={this.props.buttonStyle.secondary} onClick={() => {
                this.bet(YES)}
              }>
                <Scaler config={{startZoomAt:400,origin:"50% 50%"}}>
                  <i className="fas fa-check"></i> {"YES (" + this.state.odds[0] * 100 + "%)"}
                </Scaler>
              </button>
            </div>
            <div className="col-6 p-1">
            <button className="btn btn-large w-100" style={this.props.buttonStyle.secondary} onClick={()=>{
                this.bet(NO)}
            }>
              <Scaler config={{startZoomAt:400,origin:"50% 50%"}}>
                <i className="fas fa-times"></i> {"NO (" + this.state.odds[1] * 100 + "%)"}
              </Scaler>
            </button>
            </div>
          </div>

        </div>
      </div>
    )
  }
}
