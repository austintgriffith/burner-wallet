import React from 'react';
import Ruler from "./Ruler";
import Balance from "./Balance";


export default ({balance, address}) => {
  return (
    <div className="send-to-address card w-100">
      <Balance amount={balance} address={address} />
      <Ruler />
      <div className="content row">
        <div className="form-group w-100">
          <label htmlFor="amount_input">Amount</label>
          <div className="input-group">
            <div className="input-group-prepend">
              <div className="input-group-text">$</div>
            </div>
            <input type="text" className="form-control" placeholder="0.00"/>
          </div>
        </div>
        <button className="btn btn-lg w-100 disabled">Send</button>
      </div>
    </div>
  )
}
