import React from 'react';
import Web3 from 'web3';
import Ruler from "./Ruler";
import { Scaler } from "dapparatus";
import Balance from "./Balance";
import Blockies from 'react-blockies';
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
    this.setState({ canWithdraw: this.canWithdraw() })
    pollInterval = setInterval(this.poll.bind(this),1500)
    setTimeout(this.poll.bind(this),250)
  }
  componentWillUnmount(){
    clearInterval(pollInterval)
  }

  async poll(){
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
    return (parseFloat(this.state.amount) > 0 && parseFloat(this.state.amount) <= parseFloat(this.state.fromBalance))
  }

  withdraw = () => {
    let { fromAddress, amount, metaAccount } = this.state;


    if(this.state.canWithdraw){

        console.log("SWITCH TO LOADER VIEW...")
        this.props.changeView('loader')
        setTimeout(()=>{window.scrollTo(0,0)},60)
        //console.log("metaAccount",this.state.metaAccount,"amount",this.props.web3.utils.toWei(amount,'ether'))
        let tx

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
                    {this.props.web3.utils.hexToUtf8(prod.name)} ${this.props.dollarDisplay(costInDollars)}
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

    return (
      <div>
          <div className="content row">
            <div className="form-group w-100">
              <div className="form-group w-100">
                <label htmlFor="amount_input">{i18n.t('withdraw_from_private.from_address')}</label>
                <input type="text" className="form-control" placeholder="0x..." value={fromAddress} />
              </div>

              <div className="content bridge row">
                  <div className="col-6 p-1 w-100">
                    { <Blockies seed={fromAddress} scale={10} /> }
                  </div>
                  <div className="col-6 p-1 w-100">
                    <div style={{fontSize:64,letterSpacing:-2,fontWeight:500,whiteSpace:"nowrap"}}>
                      <Scaler config={{startZoomAt:1000,origin:"0% 50%"}}>
                        ${this.state.fromBalance}
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
