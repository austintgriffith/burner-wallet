import React from 'react';
import Web3 from 'web3';
import Ruler from "./Ruler";
import { Scaler } from "dapparatus";
import Balance from "./Balance";
import Badges from "../components/Badges";
import Blockies from 'react-blockies';
import axios from 'axios';
import i18n from '../i18n';

let pollInterval
let metaReceiptTracker = {}

export default class SendToAddress extends React.Component {

  constructor(props) {
    super(props);
    let initialState = {
      amount: "",//props.amount-0.01 ?
      privateKey: props.privateKey,
      canWithdraw: false,
      fromBadges: []
    }

    let tempweb3 = new Web3();
    initialState.metaAccount = tempweb3.eth.accounts.privateKeyToAccount(props.privateKey);
    initialState.fromAddress = initialState.metaAccount.address.toLowerCase();

    this.state = initialState
    console.log("WithdrawFromPrivate constructor",this.state)
  }

  updateState = (key, value) => {
    this.setState({ [key]: value },()=>{
      this.setState({ canWithdraw: this.canWithdraw() })
    });
  };

  componentDidMount(){


    this.setState({ canWithdraw: this.canWithdraw()})
    pollInterval = setInterval(this.poll.bind(this),1500)
    setTimeout(this.poll.bind(this),250)
  }
  componentWillUnmount(){
    clearInterval(pollInterval)
  }

  async poll(){

    if(this.props.contracts && this.props.contracts.Badges){
      console.log("okay polling for "+this.state.fromAddress+" for badges...")
      let badgeBalance = await this.props.contracts.Badges.balanceOf(this.state.fromAddress).call()
      console.log("badgeBalance...",badgeBalance)
      if(badgeBalance>0){
        let updateBadges = false
        for(let b = 0;b<badgeBalance;b++){
          let thisBadgeId = await this.props.contracts.Badges.tokenOfOwnerByIndex(this.state.fromAddress,b).call()
          if(!this.state.fromBadges[thisBadgeId]){

            let thisBadgeData = await this.props.contracts.Badges.tokenURI(thisBadgeId).call()
            //console.log("BADGE",b,thisBadgeId,thisBadgeData)
            if(!this.state.fromBadges[thisBadgeId]){
              console.log("Getting badge data ",thisBadgeData)
              let response = axios.get(thisBadgeData).then((response)=>{
                console.log("RESPONSE:",response)
                if(response && response.data){
                  this.state.fromBadges[thisBadgeId] = response.data
                  this.state.fromBadges[thisBadgeId].id = thisBadgeId
                  updateBadges=true
                }
              })

            }
          }
        }
        if(updateBadges||this.state.badgeBalance!=badgeBalance){
          //console.log("Saving badges state...")
          this.setState({fromBadges:this.state.fromBadges,badgeCount:badgeBalance})
        }

      }
    }



    let fromBalance
    if(this.props.ERC20TOKEN){
      fromBalance = await this.props.contracts[this.props.ERC20TOKEN].balanceOf('' + this.state.fromAddress).call()
    }else{
      fromBalance = await this.props.web3.eth.getBalance('' + this.state.fromAddress)
    }

    fromBalance = parseFloat(this.props.web3.utils.fromWei(fromBalance,'ether'))
    fromBalance = fromBalance.toFixed(2)
    console.log("from balance:",fromBalance,"of from address",this.state.fromAddress)

    if(typeof this.state.amount == "undefined"){
      this.setState({fromBalance,canWithdraw:this.canWithdraw(),amount:fromBalance})
    }else{
      this.setState({fromBalance,canWithdraw:this.canWithdraw()})
    }
  }

  canWithdraw() {
    console.log("Checking can withdraw",this.state.badgeCount)
    console.log("is greater",parseFloat(this.state.badgeCount)>0)
    return ( parseFloat(this.state.badgeCount)>0 || (parseFloat(this.state.amount) > 0 && parseFloat(this.state.amount) <= parseFloat(this.state.fromBalance)))
  }

  withdraw = () => {
    let { fromAddress, amount, metaAccount } = this.state;


    if(this.state.canWithdraw){

        console.log("SWITCH TO LOADER VIEW...")
        this.props.changeView('loader')
        setTimeout(()=>{window.scrollTo(0,0)},60)
        //console.log("metaAccount",this.state.metaAccount,"amount",this.props.web3.utils.toWei(amount,'ether'))
        let tx

        if(amount>0){
          if(this.props.ERC20TOKEN){
            tx={
              to:this.props.contracts[this.props.ERC20TOKEN]._address,
              data: this.props.contracts[this.props.ERC20TOKEN].transfer(this.props.address,this.props.web3.utils.toWei(""+amount,'ether')).encodeABI(),
              gas: 60000,
              gasPrice: Math.round(1100000000)//1.1gwei
            }
          }else{
            tx={
              to:this.props.address,
              value: this.props.web3.utils.toWei(amount,'ether'),
              gas: 30000,
              gasPrice: Math.round(1100000000)//1.1gwei
            }
          }

          this.props.web3.eth.accounts.signTransaction(tx, metaAccount.privateKey).then(signed => {
              this.props.web3.eth.sendSignedTransaction(signed.rawTransaction).on('receipt', (receipt)=>{
                console.log("META RECEIPT",receipt)
                if(receipt&&receipt.transactionHash&&!metaReceiptTracker[receipt.transactionHash]){
                  metaReceiptTracker[receipt.transactionHash] = true
                  this.props.goBack();
                  window.history.pushState({},"", "/");
                  this.props.changeAlert({
                    type: 'success',
                    message: 'Withdrawn! '+receipt.transactionHash,
                  });
                }

              })
          });
        }

        if(this.state.badgeCount){
          for(let b in this.state.fromBadges){
            console.log("WITHDRAW Badge ",b)

            tx={
              to:this.props.contracts['Badges']._address,
              //.Badges.transferFrom(this.props.address,this.state.toAddress,this.props.badge.id)
              data: this.props.contracts['Badges'].transferFrom(fromAddress,this.props.address,this.state.fromBadges[b].id).encodeABI(),
              gas: 240000,
              gasPrice: Math.round(1100000000)//1.1gwei
            }

            this.props.web3.eth.accounts.signTransaction(tx, metaAccount.privateKey).then(signed => {
                this.props.web3.eth.sendSignedTransaction(signed.rawTransaction).on('receipt', (receipt)=>{
                  console.log("META RECEIPT",receipt)
                  if(receipt&&receipt.transactionHash&&!metaReceiptTracker[receipt.transactionHash]){
                    metaReceiptTracker[receipt.transactionHash] = true
                    this.props.goBack();
                    window.history.pushState({},"", "/");
                    this.props.changeAlert({
                      type: 'success',
                      message: 'Withdrawn! '+receipt.transactionHash,
                    });
                  }

                })
            });


            /*this.props.tx(
              this.props.contracts.Badges.transferFrom(this.props.address,this.state.toAddress,this.props.badge.id)
              ,240000,0,0,(receipt)=>{
                if(receipt){

                  console.log("SEND BADGE COMPLETE?!?",receipt)
                  this.props.goBack();
                  window.history.pushState({},"", "/");
                  this.props.setReceipt({to:toAddress,from:receipt.from,badge:this.props.badge,result:receipt})
                  this.props.changeView("receipt");
                  this.props.clearBadges()
                }
              }
            )*/
          }
        }


    }else{
      this.props.changeAlert({type: 'warning', message: i18n.t('withdraw_from_private.error')})
    }
  };

  render() {
    let { canWithdraw, fromAddress } = this.state;

    let products = []
    for(let p in this.props.products){
      let prod = this.props.products[p]
      if(prod.exists){
        if(prod.isAvailable){
          let costInDollars = this.props.web3.utils.fromWei(prod.cost,'ether')
          products.push(
            <div key={p} className="content bridge row">
              <div className="col-12 p-1">
                <button className="btn btn-large w-100"
                  onClick={()=>{
                    console.log(prod.id,prod.name,prod.cost,prod.isAvailable)
                    let currentAmount = this.state.amount
                    if(currentAmount) currentAmount+=parseFloat(costInDollars)
                    else currentAmount = parseFloat(costInDollars)
                    if(currentAmount!=this.state.amount){
                      this.setState({amount:currentAmount})
                    }
                  }}
                  style={this.props.buttonStyle.secondary}>
                  <Scaler config={{startZoomAt:400,origin:"50% 50%"}}>
                    {this.props.web3.utils.hexToUtf8(prod.name)} {this.props.dollarDisplay(costInDollars)}
                  </Scaler>
                </button>
              </div>
            </div>
          )
        }

      }
    }
    if(products.length>0){
      products.push(
        <div key={"reset"} className="content bridge row">
          <div className="col-12 p-1">
            <button className="btn btn-large w-100"
              onClick={()=>{
                this.setState({amount:""})
              }}
              style={this.props.buttonStyle.secondary}>
              <Scaler config={{startZoomAt:400,origin:"50% 50%"}}>
                Reset
              </Scaler>
            </button>
          </div>
        </div>
      )
    }

    let amountWithdrawDislay

    if(this.state.fromBalance>0){
      amountWithdrawDislay = (
        <div>
        <div className="content bridge row">
            <div className="col-6 p-1 w-100">
              { <Blockies seed={fromAddress} scale={10} /> }
            </div>
            <div className="col-6 p-1 w-100">
              <div style={{fontSize:64,letterSpacing:-2,fontWeight:500,whiteSpace:"nowrap"}}>
                <Scaler config={{startZoomAt:1000,origin:"0% 50%"}}>
                  {this.props.dollarDisplay(this.state.fromBalance)}
                </Scaler>
              </div>
            </div>
        </div>

        <label htmlFor="amount_input">{i18n.t('withdraw_from_private.amount')}</label>
        <div className="input-group">
          <div className="input-group-prepend">
            <div className="input-group-text">$</div>
          </div>
          <input type="number" className="form-control" placeholder="0.00" value={this.state.amount}
                 onChange={event => this.updateState('amount', event.target.value)} />
        </div>
        </div>
      )
    }else{
      amountWithdrawDislay = (
        <div className="content bridge row">
            <div className="col-12 p-1 w-100">
              { <Blockies seed={fromAddress} scale={10} /> }
            </div>
        </div>
      )
    }

    return (
      <div>
          <div className="content row">
            <div className="form-group w-100">
              <div className="form-group w-100">
                <label htmlFor="amount_input">{i18n.t('withdraw_from_private.from_address')}</label>
                <input type="text" className="form-control" placeholder="0x..." value={fromAddress} />
              </div>

              <div className="content bridge row">
                  <div className="col-12 p-1 w-100">
                    <Badges
                      badges={this.state.fromBadges}
                      address={this.props.address}
                      selectBadge={()=>{}}
                    />
                  </div>
              </div>

              {amountWithdrawDislay}

              {products}
            </div>
            <button style={this.props.buttonStyle.primary} className={`btn btn-success btn-lg w-100 ${canWithdraw ? '' : 'disabled'}`}
                    onClick={this.withdraw}>
              {i18n.t('withdraw_from_private.withdraw')}
            </button>
          </div>
      </div>
    )
  }
}
