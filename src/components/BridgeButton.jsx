import React from 'react';
import { Button } from "dapparatus"

export default class BridgeButton extends React.Component {

    render() {
      let element = "";

      if(window.location.hostname.indexOf("xdai") >= 0 || window.location.hostname.indexOf("localhost") >= 0){
        element = (
          <div>
            <Button size="2" color={"blue"} onClick={() => {
                window.location = "https://dai-bridge.poa.network"
              }}>
            xDai Bridge
            </Button>
          </div>
        )
      }

      return element;
    }
}
