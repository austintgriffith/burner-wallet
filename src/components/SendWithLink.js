import React from 'react';
import Balance from "./Balance";
import i18n from '../i18n';

import {
  Field,
  Input,
  Button
} from 'rimble-ui'

export default class SendWithLink extends React.Component {

  constructor(props) {
    super(props);
    let startingAmount = 0.15
    if(props.amount){
      startingAmount = props.amount
    }
    this.state = {
      amount: props.amount,
      canSend: false,
    }
  }

  componentDidMount(){
    setTimeout(()=>{
      this.amountInput.focus();
    },250)
  }

  updateState = (key, value) => {
    this.setState({ [key]: value },()=>{
      this.setState({ canSend: (this.state.amount > 0) })
    });

  };

  send = () => {
    let { amount } = this.state;
    let { convertToDollar } = this.props

    if(this.state.canSend){

      amount = convertToDollar(amount)
      console.log("CONVERTED TO DOLLAR AMOUNT",amount)

      //if(this.props.balance-0.0001<=amount){
      //  this.props.changeAlert({type: 'warning', message: 'You can only send $'+Math.floor((this.props.balance-0.0001)*100)/100+' (gas costs)'})
      //}else{
        this.props.changeView('loader')
        setTimeout(()=>{window.scrollTo(0,0)},60)
        this.props.sendWithLink(amount, (result) => {
          if(result && result.transactionHash){
            this.props.changeView('share-link')
            this.props.changeAlert({
              type: 'success',
              message: 'Sent! '+result.transactionHash,
            });
          }
        })
      //}
    }else{
      this.props.changeAlert({type: 'warning', message: i18n.t('send_with_link.error')})
    }
  };

  render() {
    let { canSend } = this.state;
    return (
      <div>
        <Field label={'Amount'}>
          <Input
            width={1}
            type="number"
            step="0.1"
            placeholder="$0.00"
            ref={(input) => { this.amountInput = input; }}
            onChange={event => this.updateState('amount', event.target.value)}
          />
        </Field>
        <Button size={'large'} width={1} onClick={this.send} disabled={canSend}>
          Send
        </Button>
      </div>
    )
  }
}
