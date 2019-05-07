import React from 'react';
import { Scaler } from "dapparatus";
import { Flex, Box, OutlineButton } from 'rimble-ui';
import Ruler from "./Ruler";
import {CopyToClipboard} from "react-copy-to-clipboard";
import Balance from "./Balance";
import i18n from '../i18n';



export default ({isVendor, buttonStyle,ERC20TOKEN,address, balance, changeAlert, changeView, dollarDisplay, subBalanceDisplay}) => {

  return (
    <Box>
      <Flex mx={-2}>
        <Box width={[1, 1/2, 1/2]} m={2}>
          <OutlineButton width={1} onClick={() => changeView("request_funds")}>
            <Flex alignItems="center">
              <Box mr={2}>
                <i className="fas fa-hand-holding-usd"></i>
              </Box> {i18n.t('more_buttons.request')}
            </Flex>
          </OutlineButton>
        </Box>
        <Box width={[1, 1/2, 1/2]} m={2}>
          <OutlineButton width={1} onClick={() => changeView("helena")}>
            <Flex alignItems="center">
              <Box mr={2}>
                <i className="fas fa-fire"></i>
              </Box> {"Predict"}
            </Flex>
          </OutlineButton>
        </Box>
      </Flex>
    </Box>
  )
}
