import React from "react";
import i18n from "../i18n";
import {
  OutlineButton,
  Flex,
  Box
} from "rimble-ui";

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
      <OutlineButton icon={'Shuffle'} width={1} onClick={() => {changeView("exchange");}}>
        {i18n.t("more_buttons.exchange")}
      </OutlineButton>
    );
  } else {
    exchangeButton = (
      <OutlineButton icon={'CreditCard'} width={1} onClick={() => {changeView("cash_out");}}>
        {"Cash Out"}
      </OutlineButton>
    );
  }

  return (
    <Flex>
      <Box width={1/2} mr={3}>
        <OutlineButton icon={'AttachMoney'} width={1} onClick={() => {changeView("request_funds");}}>
          {i18n.t("more_buttons.request")}
        </OutlineButton>
      </Box>
      <Box width={1/2}>
        {exchangeButton}
      </Box>
    </Flex>
  );
};
