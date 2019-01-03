import React from 'react';
import Ruler from "./Ruler";
import Balance from "./Balance";



export default ({mainStyle, address, balance, burnWallet, goBack, dollarDisplay}) => {

  return (
    <div className="main-card card w-100">
      <Balance amount={balance} address={address} dollarDisplay={dollarDisplay}/>
      <div style={{textAlign:"center",width:"100%",fontWeight:'bold',fontSize:40}}>
        Are you sure you want to burn this private key?
      </div>
      <div style={{textAlign:"center",marginTop:20,width:"100%",fontWeight:'bold',fontSize:20}}>
        Don't do it! You will lose all funds!
      </div>
      <div>
        <Ruler/>
        <div className="content ops row">

            <div className="col-6 p-1">
              <button className="btn btn-large w-100" style={{backgroundColor:mainStyle.mainColor}} onClick={goBack} >
                  <i className="fas fa-arrow-left"  /> No, Cancel!
              </button>
            </div>

          <div className="col-6 p-1">
            <button className="btn btn-large w-100" style={{backgroundColor:"#c53838"}} onClick={burnWallet}>
                <i className="fas fa-fire"/> Burn It!
            </button>
          </div>
        </div>
      </div>

    </div>
  )
}
