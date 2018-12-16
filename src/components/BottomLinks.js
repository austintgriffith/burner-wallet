import React from 'react';

export default () => {
  return (
    <div className="text-center bottom-text">
      <span style={{padding:10}}>
        <a href="https://github.com/austintgriffith/burner-wallet" style={{color:"#FFFFFF"}} target="_blank">
          <i className="fas fa-code"/> Contribute
        </a>
      </span>
      <span style={{padding:10}}>
        <a href="mailto:austin@concurrence.io?Subject=Burner%20Wallet%20Feedback" target="_top" style={{color:"#FFFFFF"}}>
          <i className="fas fa-comment"/> Feedback
        </a>
      </span>
      <span style={{padding:10}}>
        <a href="https://medium.com/gitcoin/ethereum-in-emerging-economies-b235f8dac2f2" style={{color:"#FFFFFF"}} target="_blank">
          <i className="fas fa-info-circle"/> Information
        </a>
      </span>

    </div>
  )
};
