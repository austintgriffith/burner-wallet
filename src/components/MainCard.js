import React from "react";
import { Flex, Button, Icon, OutlineButton, Box, Text } from "rimble-ui";
import i18next from "i18next";

export default ({
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


  return (
    <Box>
      {sendButtons}
    </Box>
  );
};
