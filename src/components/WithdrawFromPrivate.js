import React from 'react';
import Web3 from 'web3';
import Ruler from "./Ruler";
import Balance from "./Balance";
import Blockies from 'react-blockies';

let pollInterval

export default class SendToAddress extends React.Component {

  constructor(props) {
    super(props);
    let initialState = {
      amount: props.amount,
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
    let fromBalance = await this.props.web3.eth.getBalance('' + this.state.fromAddress)
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
    return (this.state.amount > 0 && this.state.amount <= this.state.fromBalance)
  }

  withdraw = () => {
    let { fromAddress, amount, metaAccount } = this.state;


    if(this.state.canWithdraw){

        console.log("SWITCH TO LOADER VIEW...")
        this.props.changeView('loader')
        setTimeout(()=>{window.scrollTo(0,0)},60)
        console.log("metaAccount",this.state.metaAccount,"amount",this.props.web3.utils.toWei(amount,'ether'))
        let tx={
          to:this.props.address,
          value: this.props.web3.utils.toWei(amount,'ether'),
          gas: 30000,
          gasPrice: Math.round(1100000000)//1.1gwei
        }
        this.props.web3.eth.accounts.signTransaction(tx, metaAccount.privateKey).then(signed => {
            this.props.web3.eth.sendSignedTransaction(signed.rawTransaction).on('receipt', (receipt)=>{
              console.log("META RECEIPT",receipt)
              this.props.goBack();
              window.history.pushState({},"", "/");
              this.props.changeAlert({
                type: 'success',
                message: 'Withdrawn! '+receipt.transactionHash,
              });
            })
        });


    }else{
      this.props.changeAlert({type: 'warning', message: 'Please enter a valid amount to withdraw'})
    }
  };

  render() {
    let { canWithdraw, fromAddress } = this.state;

    return (
      <div>
        <div className="send-to-address card w-100">
          <Balance amount={this.props.balance} address={this.props.address} dollarDisplay={this.props.dollarDisplay}/>
          <Ruler/>
          <div className="content row">
            <div className="form-group w-100">
              <div className="form-group w-100">
                <label htmlFor="amount_input">Withdraw From Address</label>
                <input type="text" className="form-control" placeholder="0x..." value={fromAddress} />
              </div>

              <div className="content bridge row">
                  <div className="col-6 p-1 w-100">
                    { <Blockies seed={fromAddress} scale={10} /> }
                  </div>
                  <div className="col-6 p-1 w-100">
                    <div style={{fontSize:64,letterSpacing:-2,fontWeight:500}}>
                      ${this.state.fromBalance}
                    </div>
                  </div>
              </div>

              <label htmlFor="amount_input">Send Amount</label>
              <div className="input-group">
                <div className="input-group-prepend">
                  <div className="input-group-text">$</div>
                </div>
                <input type="text" className="form-control" placeholder="0.00" value={this.state.amount}
                       onChange={event => this.updateState('amount', event.target.value)} />
              </div>
            </div>
            <button className={`btn btn-success btn-lg w-100 ${canWithdraw ? '' : 'disabled'}`}
                    onClick={this.withdraw}>
              Withdraw
            </button>
          </div>
        </div>
        <div className="text-center bottom-text">
          <span style={{padding:10}}>
            <a href="#" style={{color:"#FFFFFF"}} onClick={()=>{this.props.goBack()}}>
              <i className="fas fa-times"/> cancel
            </a>
          </span>
        </div>
      </div>
    )
  }
}
