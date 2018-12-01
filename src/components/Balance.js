import React from 'react';
import Blockies from 'react-blockies';

export  default ({amount, address}) => {
  return (
    <div className="balance content row">
      <div className="avatar col p-0">
        <Blockies seed={address} scale={10} />
      </div>
      <div className="amount col p-0">
        <span>Balance</span>
        <div>${amount.toFixed(2)}</div>
      </div>
    </div>
  )
};
