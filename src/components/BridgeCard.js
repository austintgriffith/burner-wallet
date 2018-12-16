import React from 'react';
import Ruler from "./Ruler";
import {CopyToClipboard} from "react-copy-to-clipboard";

export default ({privateKey, burnWallet, changeAlert}) => {
  return (
    <div className="main-card card w-100">
      <div className="content bridge row">
        <a className="btn btn-large w-100" href="https://dai-bridge.poa.network/" target="_blank" rel="noopener noreferrer">
          <i className="fas fa-money-bill-wave"></i> Convert DAI {"<-->"}xDai
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
              <i className="fas fa-save"/> Save Wallet
              </button>
            </div>
          </CopyToClipboard>
          <div className="col-6 p-1">
            <button className="btn btn-large w-100"
                    onClick={burnWallet}>
              <i className="fas fa-fire"/> Burn Wallet
            </button>
          </div>
        </div>
      </div>
      }
    </div>
  )
}
