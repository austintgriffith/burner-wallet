import React from 'react';
import Ruler from "./Ruler";
import Balance from "./Balance";
import Blockies from 'react-blockies';
import {CopyToClipboard} from "react-copy-to-clipboard";
import i18n from '../i18n';
import RecentTransactions from './RecentTransactions';
import { Text, Flex, Input, Box, Field, Button, Form, QR as QRCode, PublicAddress } from "rimble-ui";

export default class RequestFunds extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      message: "",
      amount: "",
      canRequest: false,
      requested: false
    }
  }

  updateState = (key, value) => {
    this.setState({ [key]: value },()=>{
      this.setState({ canRequest: (this.state.amount > 0) })
    });
  };

  request = () => {
    let { message, amount } = this.state;
    if(this.state.canRequest){
      this.setState({requested:true})
    }else{
      this.props.changeAlert({type: 'warning', message: 'Please enter a valid amount'})
    }
  };

  render() {
    let { canRequest, message, amount, requested } = this.state;
    let {dollarDisplay,view,buttonStyle,ERC20TOKEN,address, changeView, dollarSymbol} = this.props
    if(requested){

      let url = window.location.protocol+"//"+window.location.hostname
      if(window.location.port&&window.location.port!=80&&window.location.port!=443){
        url = url+":"+window.location.port
      }
      let qrSize = Math.min(document.documentElement.clientWidth,512)-90
      let qrValue = url+"/"+this.props.address+";"+amount+";"+encodeURI(message).replaceAll("#","%23").replaceAll(";","%3B").replaceAll(":","%3A").replaceAll("/","%2F")

      return (
        <div>
          <CopyToClipboard text={qrValue} onCopy={() => {
            this.props.changeAlert({type: 'success', message: 'Request link copied to clipboard'})
          }}>
            <Box>
              <Text fontSize={3} textAlign={'center'}>{dollarDisplay(amount)}</Text>
              <Text textAlign={'center'}>{message}</Text>
              <Flex flexDirection={'column'} alignItems={'center'} p={3} border={1} borderColor={'grey'} borderRadius={1}>
                <QRCode value={address} size={'100%'} renderAs={'svg'} />
              </Flex>
              <Box mt={3}>
                <PublicAddress address={address} />
              </Box>
            </Box>
          </CopyToClipboard>
          <RecentTransactions
            dollarDisplay={dollarDisplay}
            view={view}
            max={5}
            buttonStyle={buttonStyle}
            ERC20TOKEN={ERC20TOKEN}
            transactionsByAddress={ERC20TOKEN?this.props.fullTransactionsByAddress:this.props.transactionsByAddress}
            changeView={changeView}
            address={address}
            block={this.props.block}
            recentTxs={ERC20TOKEN?this.props.fullRecentTxs:this.props.recentTxs}
          />
        </div>
      )
    }else{
      return (
        <Form>
          <Field label={i18n.t('request_funds.amount')}>
            <Input type="number" placeholder="0" value={this.state.amount} width={'100%'}
                onChange={event => this.updateState('amount', event.target.value)} required />
          </Field>
          <Field label={i18n.t('request_funds.item_message')}>
            <Input type="text" placeholder="Pizza" value={this.state.message} width={'100%'}
              onChange={event => this.updateState('message', event.target.value)} required />
          </Field>
          <Button fullWidth className={`${canRequest ? '' : 'disabled'}`} onClick={this.request} disabled={!canRequest}>
            {i18n.t('request_funds.button')}
          </Button>
        </Form>
      )
    }

  }
}
