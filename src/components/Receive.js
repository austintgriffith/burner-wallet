import React from 'react';
import Ruler from "./Ruler";
import Balance from "./Balance";
import {CopyToClipboard} from "react-copy-to-clipboard";
import RecentTransactions from './RecentTransactions';
import { scroller } from 'react-scroll'
import i18n from '../i18n';

import {
  Flex,
  Box,
  PublicAddress,
  QR as QRCode
} from 'rimble-ui'

export default class Receive extends React.Component {

  constructor(props) {
    super(props);
    let initialState = {
    }
  }
  render() {
    let {
      view,
      buttonStyle,
      ERC20TOKEN,
      address,
      balance,
      changeAlert,
      changeView,
      dollarDisplay,
      subBalanceDisplay,
      account
    } = this.props

    return (
      <div>
        <div>
          <CopyToClipboard text={address} onCopy={() => {
            changeAlert({type: 'success', message: i18n.t('receive.address_copied')})
          }}>
            <Box>
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
        <div name="theVeryBottom" className="text-center bottom-text">
          <span style={{padding:10}}>
            <a href="#" style={{color:"#FFFFFF"}} onClick={()=>{this.props.goBack()}}>
              <i className="fas fa-times"/> {i18n.t('cancel')}
            </a>
          </span>
        </div>
      </div>
    )
  }
}
