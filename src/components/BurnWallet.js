import React from 'react';
import Ruler from "./Ruler";
import Balance from "./Balance";
import i18n from '../i18n';



export default ({mainStyle, address, balance, burnWallet, goBack, dollarDisplay}) => {

  return (

    <div>
      <div style={{textAlign:"center",width:"100%",fontWeight:'bold',fontSize:30}}>
        {i18n.t('burn_wallet.burn_private_key_question')}
      </div>
      <div style={{textAlign:"center",marginTop:20,width:"100%",fontWeight:'bold',fontSize:20}}>
        {i18n.t('burn_wallet.disclaimer')}
      </div>
      <div>
        <Ruler/>
        <div className="content ops row">

            <div className="col-6 p-1">
              <button className="btn btn-large w-100" style={{backgroundColor:mainStyle.mainColor}} onClick={goBack} >
                  <i className="fas fa-arrow-left"  /> {i18n.t('burn_wallet.cancel')}
              </button>
            </div>

          <div className="col-6 p-1">
            <button className="btn btn-large w-100" style={{backgroundColor:"#c53838"}} onClick={burnWallet}>
                <i className="fas fa-fire"/> {i18n.t('burn_wallet.burn')}
            </button>
          </div>
        </div>
      </div>

    </div>
  )
}
