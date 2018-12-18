import React from 'react';
import { Scaler } from "dapparatus";
import Ruler from "./Ruler";
import {CopyToClipboard} from "react-copy-to-clipboard";

export default ({privateKey, burnWallet, changeAlert}) => {
  return (
    <div className="main-card card w-100">
      <div className="content bridge row" style={{padding:10}}>

        <a className="btn btn-large w-100" href="https://dai-bridge.poa.network/" target="_blank" rel="noopener noreferrer">
          <Scaler config={{startZoomAt:500,origin:"50% 50%",adjustedZoom:1}}>
            <i className="fas fa-money-bill-wave"></i> Convert DAI {"<-->"}xDai
          </Scaler>
        </a>

      </div>
      {privateKey &&
      <div>
        <Ruler/>
        <div className="content ops row">
          <CopyToClipboard text={privateKey}>
            <div className="col-6 p-1"
                 onClick={() => changeAlert({type: 'success', message: 'Private Key copied to clipboard'})}>
              <button className="btn btn-large w-100">
                <Scaler config={{startZoomAt:500,origin:"25% 50%",adjustedZoom:1}}>
                  <i className="fas fa-save"/> Save Wallet
                </Scaler>
              </button>
            </div>
          </CopyToClipboard>
          <div className="col-6 p-1">
            <button className="btn btn-large w-100"
                    onClick={burnWallet}>
              <Scaler config={{startZoomAt:500,origin:"25% 50%",adjustedZoom:1}}>
                <i className="fas fa-fire"/> Burn Wallet
              </Scaler>
            </button>
          </div>
        </div>
      </div>
      }
    </div>
  )
}
