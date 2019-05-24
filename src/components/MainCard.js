import React from "react";
import { Flex, Button, Icon, OutlineButton, Box, Text } from "rimble-ui";
import i18next from "i18next";

export default ({
  ERC20TOKEN,
  changeView,
}) => {
  let sendButtons = (
    <Box>
      <Flex mx={-2}>
        <Box width={[1, 1/2, 1/2]} m={2}>
          <Button fullWidth onClick={() => changeView("receive")}>
            <Flex alignItems="center">
              <Icon name="CenterFocusWeak" mr={2} />
              {i18next.t("main_card.receive")}
            </Flex>
          </Button>
        </Box>
        <Box width={[1, 1/2, 1/2]} m={2}>
          <Button fullWidth onClick={() => changeView("send_to_address")}>
            <Flex alignItems="center">
              <Icon name="Send" mr={2} />
              {i18next.t("main_card.send")}
            </Flex>
          </Button>
        </Box>
      </Flex>
    </Box>
  );

  if (ERC20TOKEN) {
    sendButtons = (
      <Box>
        <Flex mx={-2}>
          <Box width={[1, 1/2, 1/2]} m={2}>
            AttachMoney
            <OutlineButton fullWidth onClick={() => changeView("receive")}>
              <Flex alignItems="center">
                <Icon name="CenterFocusWeak" mr={2} />
                <Text>{i18next.t("main_card.receive")}</Text>
              </Flex>
            </OutlineButton>
          </Box>
          <Box width={[1, 1/2, 1/2]} m={2}>
            <OutlineButton
              fullWidth
              onClick={() => changeView("send_to_address")}
            >
              <Flex alignItems="center">
                <Icon name="Send" mr={2} />
                <Text>{i18next.t("main_card.send")}</Text>
              </Flex>
            </OutlineButton>
          </Box>
        </Flex>
        <Flex mx={-2}>
          <Box width={[1, 1/2, 1/2]} m={2}>
            <OutlineButton fullWidth onClick={() => changeView("share")}>
              <Flex alignItems="center">
                <Icon name="Share" mr={2} />
                <Text>{i18next.t("main_card.share")}</Text>
              </Flex>
            </OutlineButton>
          </Box>
          <Box width={[1, 1/2, 1/2]} m={2}>
            <OutlineButton fullWidth onClick={() => changeView("vendors")}>
              <Flex alignItems="center">
                <Icon name="Money" mr={2} />
                <Text>{i18next.t("main_card.vendors")}</Text>
              </Flex>
            </OutlineButton>
          </Box>
        </Flex>
      </Box>
    );
  }

  return (
    <Box>
      {sendButtons}
    </Box>
  );
};
