import React from "react";
import { Flex, Icon, Box } from "rimble-ui";
import i18next from "i18next";

export default ({
  changeView,
}) => {
  let sendButtons = (
    <Box>
      <Flex mx={-2}>
        <Box width={[1, 1/2, 1/2]} m={2}>
          <button className="cta_button" onClick={() => changeView("receive")}>
              <Icon name="CenterFocusWeak" mr={2} />
              {i18next.t("main_card.receive")}
          </button>
        </Box>
        <Box width={[1, 1/2, 1/2]} m={2}>
          <button className="cta_button" onClick={() => changeView("send_to_address")}>
              <Icon name="Send" mr={2} />
              {i18next.t("main_card.send")}
          </button>
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
