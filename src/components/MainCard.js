import React from 'react';
import { Scaler } from "dapparatus";
import { Flex, Button, Icon, OutlineButton, Box, Text } from "rimble-ui";
import {CopyToClipboard} from "react-copy-to-clipboard";
import i18next from 'i18next';



export default ({buttonStyle,ERC20TOKEN,address, balance, changeAlert, changeView, dollarDisplay, subBalanceDisplay}) => {


  var w = window,
  d = document,
  e = d.documentElement,
  g = d.getElementsByTagName('body')[0],
  x = w.innerWidth || e.clientWidth || g.clientWidth,
  y = w.innerHeight|| e.clientHeight|| g.clientHeight;

  let pushDownWithWhiteSpace = 0
  /*if(y){
    if(ERC20TOKEN){
      pushDownWithWhiteSpace = y-443
    }else{
      pushDownWithWhiteSpace = y-370
    }

  }
  if(pushDownWithWhiteSpace>230){
    pushDownWithWhiteSpace=230
  }*/
  let sendButtons = (
    <Box>
      <Flex mx={-2}>
        <Box width={[1, 1/2, 1/2]} m={2}>
          <Button fullWidth onClick={() => changeView("receive")}>
            <Flex alignItems="center">
              <Box mr={2}>
                <i className="fas fa-qrcode"  />
              </Box> {i18next.t('main_card.receive')}
            </Flex>
          </Button>
        </Box>
        <Box width={[1, 1/2, 1/2]} m={2}>
          <Button fullWidth onClick={() => changeView("send_to_address")}>
            <Flex alignItems="center">
              <Box mr={2}>
                <i className="fas fa-paper-plane"/>
              </Box> {i18next.t('main_card.send')}
            </Flex>
          </Button>
        </Box>
      </Flex>
      <Flex mx={-2}>
        <Box width={[1, 1/2, 1/2]} m={2}>
          <OutlineButton fullWidth onClick={() => changeView("share")}>
            <Flex alignItems="center">
              <Box mr={2}>
                <i className="fas fa-share"/>
              </Box> {i18next.t('main_card.share')}
            </Flex>
          </OutlineButton>
        </Box>
        <Box width={[1, 1/2, 1/2]} m={2}>
          <OutlineButton fullWidth onClick={() => changeView("send_with_link")}>
            <Flex alignItems="center">
              <Box mr={2}>
              <i className="fas fa-money-bill-alt"  />
              </Box> {i18next.t('main_card.link')}
            </Flex>
          </OutlineButton>
        </Box>
      </Flex>
    </Box>
  )

  if(ERC20TOKEN){
    sendButtons = (
      <Box>
        <Flex mx={-2}>
          <Box width={[1, 1/2, 1/2]} m={2}>
            <Button fullWidth onClick={() => changeView("receive")}>
              <Flex alignItems="center">
                <Box mr={2}>
                  <i className="fas fa-qrcode"  />
                </Box>
                <Text color={'white'} bold>{i18next.t('main_card.receive')}</Text>
              </Flex>
            </Button>
          </Box>
          <Box width={[1, 1/2, 1/2]} m={2}>
            <Button
              fullWidth
              onClick={() => changeView("send_to_address")}
            >
              <Flex alignItems="center">
                <Box mr={2}>
                  <i className="fas fa-paper-plane"/>
                </Box>
                <Text color={'white'} bold>{i18next.t('main_card.send')}</Text>
              </Flex>
            </Button>
          </Box>
        </Flex>
      </Box>
    )
  }


  return (
    <Box>
      {sendButtons}
    </Box>
  )
}
