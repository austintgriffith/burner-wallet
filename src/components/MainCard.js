import React from "react";
import { Scaler } from "dapparatus";
import { Flex, Button, Icon, OutlineButton, Box } from "rimble-ui";
import { CopyToClipboard } from "react-copy-to-clipboard";
import i18next from "i18next";

export default ({
  buttonStyle,
  ERC20TOKEN,
  address,
  balance,
  changeAlert,
  changeView,
  dollarDisplay,
  subBalanceDisplay
}) => {
  var w = window,
    d = document,
    e = d.documentElement,
    g = d.getElementsByTagName("body")[0],
    x = w.innerWidth || e.clientWidth || g.clientWidth,
    y = w.innerHeight || e.clientHeight || g.clientHeight;

  let pushDownWithWhiteSpace = 0;
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
    <div>
      <Flex px={2}>
        <Box width={[1, 1/2, 1/2]} m={2}>
          <Button fullWidth onClick={() => changeView("receive")}>
            <Flex alignItems="center">
              <Icon name="CenterFocusWeak" />
              {i18next.t("main_card.receive")}
            </Flex>
          </Button>
        </Box>
        <Box width={[1, 1/2, 1/2]} m={2}>
          <Button fullWidth onClick={() => changeView("send_to_address")}>
            <Flex alignItems="center">
              <Icon name="Send" />
              {i18next.t("main_card.send")}
            </Flex>
          </Button>
        </Box>
      </Flex>
      <Flex px={2}>
        <Box width={[1, 1/2, 1/2]} m={2}>
          <OutlineButton fullWidth onClick={() => changeView("share")}>
            <Flex alignItems="center">
              <Icon name="Share" />
              {i18next.t("main_card.share")}
            </Flex>
          </OutlineButton>
        </Box>
        <Box width={[1, 1/2, 1/2]} m={2}>
          <OutlineButton fullWidth onClick={() => changeView("send_with_link")}>
            <Flex alignItems="center">
              <Icon name="AttachMoney" />
              {i18next.t("main_card.link")}
            </Flex>
          </OutlineButton>
        </Box>
      </Flex>
    </div>
  );

  if (ERC20TOKEN) {
    sendButtons = (
      <div>
        <div className="content ops row">
          <div className="col-6 p-1">
            AttachMoney
            <OutlineButton fullWidth onClick={() => changeView("receive")}>
              <Flex alignItems="center">
                <Icon name="CenterFocusWeak" />
                {i18next.t("main_card.receive")}
              </Flex>
            </OutlineButton>
          </div>
          <div className="col-6 p-1">
            <OutlineButton
              fullWidth
              onClick={() => changeView("send_to_address")}
            >
              <Flex alignItems="center">
                <Icon name="Send" />
                {i18next.t("main_card.send")}
              </Flex>
            </OutlineButton>
          </div>
        </div>
        <div className="content ops row">
          <div className="col-6 p-1">
            <OutlineButton fullWidth onClick={() => changeView("share")}>
              <Flex alignItems="center">
                <Icon name="Share" />
                {i18next.t("main_card.share")}
              </Flex>
            </OutlineButton>
          </div>
          <div className="col-6 p-1">
            <OutlineButton fullWidth onClick={() => changeView("vendors")}>
              <Flex alignItems="center">
                <Icon name="Money" />
                {i18next.t("main_card.vendors")}
              </Flex>
            </OutlineButton>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ paddingTop: pushDownWithWhiteSpace }}>
      <div>{sendButtons}</div>
    </div>
  );
};
