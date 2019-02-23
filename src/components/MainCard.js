import React from 'react';
import { Scaler } from "dapparatus";
import {CopyToClipboard} from "react-copy-to-clipboard";
import i18next from 'i18next';



export default ({buttonStyle,ERC20TOKEN,address, balance, changeAlert, changeView, dollarDisplay, subBalanceDisplay}) => {


  var w = window,
  d = document,
  e = d.documentElement,
  g = d.getElementsByTagName('body')[0],
  x = w.innerWidth || e.clientWidth || g.clientWidth,
  y = w.innerHeight|| e.clientHeight|| g.clientHeight;

  let pushDownWithWhiteSpace = 0
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
      <div className="content ops row">
        <div className="col-6 p-1" onClick={() => changeView('receive')}>
          <button className="btn btn-large w-100" style={buttonStyle.primary}>
            <Scaler config={{startZoomAt:400,origin:"50% 50%"}}>
              {/* <i className="fas fa-qrcode"  /> Receive */}
              <i className="fas fa-qrcode"  /> {i18next.t('main_card.receive')}
            </Scaler>
          </button>
        </div>
        <div className="col-6 p-1">
          <button className="btn btn-large w-100" onClick={() => changeView('send_to_address')} style={buttonStyle.primary}>
            <Scaler config={{startZoomAt:400,origin:"50% 50%"}}>
              {/* <i className="fas fa-paper-plane"/> Send */}
              <i className="fas fa-paper-plane"/> {i18next.t('main_card.send')}
            </Scaler>
          </button>
        </div>
      </div>
      <div className="content ops row">
        <div className="col-6 p-1" onClick={() => changeView('share')}>
          <button className="btn btn-large w-100" onClick={() => changeView('share')} style={buttonStyle.secondary}>
            <Scaler config={{startZoomAt:400,origin:"50% 50%"}}>
              <i className="fas fa-share"/> {i18next.t('main_card.share')}
            </Scaler>
          </button>
        </div>
        <div className="col-6 p-1" onClick={() => changeView('send_with_link')}>
          <button className="btn btn-large w-100" style={buttonStyle.secondary}>
            <Scaler config={{startZoomAt:400,origin:"50% 50%"}}>
              <i className="fas fa-money-bill-alt"  /> {i18next.t('main_card.link')}
            </Scaler>
          </button>
        </div>
      </div>
    </div>
  )

  if(ERC20TOKEN){
    sendButtons = (
      <div>
        <div className="content ops row">
          <div className="col-6 p-1" onClick={() => changeView('receive')}>
            <button className="btn btn-large w-100" style={buttonStyle.primary}>
              <Scaler config={{startZoomAt:400,origin:"50% 50%"}}>
                <i className="fas fa-qrcode"  /> {i18next.t('main_card.receive')}
              </Scaler>
            </button>
          </div>
          <div className="col-6 p-1">
            <button className="btn btn-large w-100" onClick={() => changeView('send_to_address')} style={buttonStyle.primary}>
              <Scaler config={{startZoomAt:400,origin:"50% 50%"}}>
                <i className="fas fa-paper-plane"/> {i18next.t('main_card.send')}
              </Scaler>
            </button>
          </div>
        </div>
        <div className="content ops row">
          <div className="col-6 p-1" onClick={() => changeView('share')}>
            <button className="btn btn-large w-100" onClick={() => changeView('share')} style={buttonStyle.secondary}>
              <Scaler config={{startZoomAt:400,origin:"50% 50%"}}>
                <i className="fas fa-share"/> {i18next.t('main_card.share')}
              </Scaler>
            </button>
          </div>
          <div className="col-6 p-1" onClick={() => changeView('vendors')}>
            <button className="btn btn-large w-100" style={buttonStyle.secondary}>
              <Scaler config={{startZoomAt:400,origin:"50% 50%"}}>
                <i className="fas fa-money-bill-alt"  /> {i18next.t('main_card.vendors')}
              </Scaler>
            </button>
          </div>
        </div>
      </div>
    )
  }


  return (
    <div style={{paddingTop:pushDownWithWhiteSpace}}>
      <div>
        {sendButtons}
      </div>
    </div>
  )
}
