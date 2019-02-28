import React from "react";
import Ruler from "./Ruler";
import { CopyToClipboard } from "react-copy-to-clipboard";
import Balance from "./Balance";
import i18n from "../i18n";
import { OutlineButton, Flex, Icon, Box } from "rimble-ui";

export default ({
  isVendor,
  buttonStyle,
  ERC20TOKEN,
  address,
  balance,
  changeAlert,
  changeView,
  dollarDisplay,
  subBalanceDisplay
}) => {
  let exchangeButton;

  if (!isVendor) {
    exchangeButton = (
      <OutlineButton
        fullWidth
        onClick={() => {
          changeView("exchange");
        }}
      >
        <Flex alignItems="center">
          <Icon name="Shuffle" />
          {i18n.t("more_buttons.exchange")}
        </Flex>
    );
  } else {
    exchangeButton = (
      <OutlineButton
        fullWidth
        onClick={() => {
          changeView("cash_out");
        }}
      >
        <Flex alignItems="center">
          <Icon name="CreditCard" />
          {"Cash Out"}
        </Flex>
      </OutlineButton>
    );
  }

  return (
    <Flex px={2}>
      <Box width={[1, 1/2, 1/2]} m={2}>
        <OutlineButton
          fullWidth
          onClick={() => {
            changeView("request_funds");
          }}
        >
          <Flex alignItems="center">
            <Icon name="AttachMoney" />
            {i18n.t("more_buttons.request")}
          </Flex>
        </OutlineButton>
      </Box>
      <Box width={[1, 1/2, 1/2]} m={2}>{exchangeButton}</Box>
    </Flex>
  );
};
