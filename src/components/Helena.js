import React from 'react';

import { Events, Blockie, Scaler } from "dapparatus";
import Web3 from 'web3';
import Gnosis from '@frontier-token-research/pm-js/'
import Ruler from "./Ruler";
import { Box, Text, Input, OutlineButton, Flex } from "rimble-ui";

const YES = 0;
const NO = 1;

const baseDomain = "https://burner-api.helena.network/";
const timeInterval = 4500;
const timeTimeOut = 300;

let interval = false

export default class Helena extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      odds: [50, 50],
      outcomeTokensSold:[0, 0],
      title: "",
      amount : 0,
      bets: []
    }
  }
  componentDidMount() {
    interval = setInterval(this.pollInterval.bind(this), timeInterval)
    setTimeout(this.pollInterval.bind(this), timeTimeOut)

    this.setState({
      MarketContract: this.props.contractLoader("Market",this.props.marketAddress)
    },()=>{
      console.log("Market Contract:",this.state.MarketContract)
    })

    this.firstApprove();

  }
  componentWillUnmount() {
    clearInterval(interval)
  }

  async pollInterval(){
      const marketInfo = await this.getMarketInfo(this.props.marketAddress)
      const bets = await this.getBets(this.props.marketAddress)

      if(marketInfo&&marketInfo.event){
        const outcomeTokensSold = marketInfo.netOutcomeTokensSold
        const title = marketInfo.event.oracle.eventDescription.title
        const odds = marketInfo.marginalPrices;
        this.setState({/*marketAddress, */odds, outcomeTokensSold, title})
      }

      let updateBets = []
      updateBets[0] = 0
      updateBets[1] = 0
      if(bets){
        for(let b in bets['results']){
          //console.log(bets['results'][b])
          let amount = this.props.web3.utils.fromWei(bets['results'][b].cost,'ether')
          amount = Math.round(parseFloat(amount)*1000)/1000
          let outcome = bets['results'][b].outcomeToken.index
          //console.log("AMOUNT:",amount,"RESULT:",outcome)
          updateBets[outcome] += amount
        }
        this.setState({bets:updateBets})
      }


  }

  async getMarketInfo(address) {
      const response = await fetch(baseDomain +`/api/markets/${address}/`)
      const json = await response.json();
      return json;
  }

  async getBets(address) {
    let url = `https://burner-api.helena.network/api/markets/${address}/trades/${this.props.address}/`
    const response = await fetch(url)
    const json = await response.json();
    console.log("json",json)
    return json;
  }

  async firstApprove() {
    console.log("CONTRACTS",this.props.contracts)
    const allowance = await this.props.contracts.Proton.allowance(this.props.address, this.props.contracts.Market._address).call();
    console.log(allowance)
    if(allowance === 0) {
      this.props.tx(
        this.props.contracts.Proton.approve(this.props.contracts.Market._address, -1),
        50000, 0, 0,(approveReceipt)=>{
      });
    }
    return true;
  }

  bet(outcome) {
      const cost = Gnosis.calcLMSROutcomeTokenCount(
          this.state.outcomeTokensSold,
          1000e18,
          outcome,
          this.state.amount * 1e18,
          0
      );
      this.props.changeView('loader')
      this.props.tx(

        this.props.contracts.Proton.approve(this.props.marketAddress, -1),
        50000, 0, 0,(approveReceipt)=>{
          this.props.tx(
            this.state.MarketContract.buy(outcome, cost.toNumber(), 400 * 1e18),
            1042570, 0, 0,(buyReceipt)=>{
              if(buyReceipt){
                console.log("BET COMPLETE?!?", buyReceipt)
                this.props.changeView('helena')
              }
            }
          )
        }
      );
  }


  render(){
    if(!this.state.title){
      return (<Text textAlign={'center'}>loading market...</Text>)
    }

    let betOpacity = 0.1
    if(this.state.bets[0]>0 || this.state.bets[1]>0){
      betOpacity = 0.6
    }
    return (
      <Box>
        <Text textAlign={'center'} fontSize={3} mb={3}>{this.state.title}</Text>

        <Input width={'100%'} type="text" placeholder="xP+ amount you want to bet" value={this.state.value}
          onChange={event => this.setState({'amount': event.target.value})}
        />
          
        <Flex mx={-2}>
          <Box width={[1, 1/2, 1/2]} m={2}>
            <OutlineButton fullWidth onClick={() => {this.bet(YES)}}>
              <Flex alignItems={'center'}>
                <Box mr={2}>
                  <i className="fas fa-check"></i>
                </Box> {"YES (" + Math.round(this.state.odds[0] * 100 *1000)/1000 + "%)"}
              </Flex>
            </OutlineButton>
          </Box>
          
          <Box width={[1, 1/2, 1/2]} m={2}>
            <OutlineButton fullWidth onClick={()=>{this.bet(NO)}}>
              <Flex alignItems={'center'}>
                <Box mr={2}>
                  <i className="fas fa-times"></i>
                </Box> {"NO (" + Math.round(this.state.odds[1] * 100 *1000)/1000 + "%)"}
              </Flex>
            </OutlineButton>
          </Box>
        </Flex>

        <Flex justifyContent={'space-around'} pt={1}>
          <Text fontSize={0} color={'moon-gray'} textAlign={'center'}>
            {this.state.bets[0]} xP+
          </Text>
          <Text fontSize={0} color={'moon-gray'} textAlign={'center'}>
            {this.state.bets[1]} xP+
          </Text>
        </Flex>
      </Box>
    )
  }
}
