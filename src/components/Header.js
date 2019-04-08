import React from 'react';
import { Scaler, Blockie } from 'dapparatus';
import burnerloader from '../burnerloader.gif';
export default ({
  scrollMode,
  openScanner,
  network,
  total,
  dollarDisplay,
  ens,
  title,
  titleImage,
  mainStyle,
  balance,
  address,
  changeView,
  view,
  splash,
}) => {
  let sendButtonOpacity = 1.0;
  if (view == 'receive' || view == 'send_badge') {
    sendButtonOpacity = 0;
  }

  let name = ens;
  if (!name) {
    name = address.substring(2, 8);
  }

  let moneyDisplay;
  let blockieDisplay;
  if (typeof total == 'undefined' || Number.isNaN(total)) {
    moneyDisplay = (
      <div style={{ opacity: 0.1, fontSize: 28, paddingTop: 15 }}>
        connecting...
      </div>
    );
    blockieDisplay = (
      <div>
        <img
          src={burnerloader}
          style={{ maxHeight: 50, opacity: 0.25, marginLeft: -20 }}
        />
      </div>
    );
  } else {
    /*moneyDisplay = (
      <div>
        ${dollarDisplay(total)}
      </div>
    )*/
    moneyDisplay = (
      <div style={{ opacity: 0.4, fontSize: 22, paddingTop: 18 }}>
        {network}
      </div>
    );
    blockieDisplay = <Blockie address={address} config={{ size: 6 }} />;
  }

  let scanButtonStyle = {
    opacity: sendButtonOpacity,
    position: 'fixed',
    right: -8,
    bottom: 63,
    zIndex: 257,
    cursor: 'pointer',
  };

  let headSpacer = '';
  let upArrow = '';

  if (splash) {
    scanButtonStyle.transform = 'scale(1.5)';
    scanButtonStyle.top = '70%';
    scanButtonStyle.right = 10;
  } else if (view == 'main') {
    const headerHeight = window.innerHeight;
    headSpacer = <div style={{ height: 40, width: '100%' }} />;
    upArrow = (
      <div
        style={{
          position: 'absolute',
          top: -25,
          left: '40%',
          zIndex: 1,
          opacity: 0.25,
          width: '20%',
          textAlign: 'center',
          fontSize: 37,
          color: '#FFFFFF',
          cursor: 'pointer',
        }}
        onClick={() => {
          scrollMode('splash');
        }}
      >
        <i className="fa fa-angle-up" />
      </div>
    );
  }

  if (view == 'send_to_address') {
    scanButtonStyle.position = 'absolute';
    scanButtonStyle.right = -3;
    scanButtonStyle.top = 217;
    delete scanButtonStyle.bottom;
  }

  let bottomRight = (
    <div
      style={scanButtonStyle}
      onClick={() => {
        openScanner({ view: 'send_to_address' });
      }}
    >
      <div
        style={{
          position: 'relative',
          backgroundImage:
            'linear-gradient(' +
            mainStyle.mainColorAlt +
            ',' +
            mainStyle.mainColor +
            ')',
          backgroundColor: mainStyle.mainColor,
          borderRadius: '50%',
          width: 89,
          height: 89,
          boxShadow: '0.5px 0.5px 5px #000000',
        }}
      >
        <a
          href="#"
          style={{ color: '#FFFFFF', position: 'absolute', left: 30, top: 28 }}
        >
          <i className="fas fa-qrcode" />
        </a>
      </div>
    </div>
  );

  let opacity = 0.5;

  let topLeft;

  if (view == 'main' || view == 'exchange') {
    opacity = 1.0;
    topLeft = (
      <div
        style={{
          zIndex: -2,
          position: 'absolute',
          left: 16,
          top: 4,
          zIndex: 1,
          cursor: 'pointer',
        }}
      >
        <a
          href={
            'https://blockscout.com/poa/dai/address/' +
            address +
            '/transactions'
          }
          target="_blank"
          style={{ color: '#FFFFFF' }}
        >
          {blockieDisplay}
          <div
            style={{ position: 'absolute', left: 60, top: 15, fontSize: 14 }}
          >
            {name}
          </div>
        </a>
      </div>
    );
  } else {
    topLeft = (
      <div
        style={{
          zIndex: -2,
          position: 'absolute',
          left: 16,
          top: 4,
          zIndex: 1,
          cursor: 'pointer',
        }}
        onClick={() => changeView('main')}
      >
        {blockieDisplay}
        <div style={{ position: 'absolute', left: 60, top: 15, fontSize: 14 }}>
          {name}
        </div>
      </div>
    );
  }

  let topRight = (
    <div
      style={{
        zIndex: -2,
        position: 'absolute',
        right: 28,
        bottom: 14,
        zIndex: 1,
        fontSize: 46,
        opacity: 0.9,
      }}
    >
      {moneyDisplay}
    </div>
  );

  return (
    <div>
      {headSpacer}
      <div className="header" style={{ opacity }}>
        {upArrow}
        {topLeft}
        {topRight}
        {bottomRight}
      </div>
    </div>
  );
};
