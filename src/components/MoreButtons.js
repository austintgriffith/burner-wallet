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
  return (
    <Flex mx={-2}>
      <Box width={[1, 1, 1]} m={2}>
        <OutlineButton
          fullWidth
          onClick={() => {
            changeView("request_funds");
          }}
        >
          <Flex alignItems="center">
            <Icon name="AttachMoney" mr={2} />
            {i18n.t("more_buttons.request")}
          </Flex>
        </OutlineButton>
      </Box>
    </Flex>
  );
};
