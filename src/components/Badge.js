import React from 'react';
import Blockies from 'react-blockies';
import { Scaler } from "dapparatus";

export  default ({id,angle,image,selectBadge,large}) => {

  let displayAngle = 28
  if(angle){
    displayAngle=angle
  }
  let zIndex = 1

  if(large){
    return (
        <div className="coin__container_large" style={{cursor:"pointer"}}>
            <div className="coin_large is-slam" style={{
                zIndex: zIndex,
                transform:"rotateX("+displayAngle+"deg)"
            }}>
                <div className="coin__front_large" style={{
                  backgroundImage: 'url("'+image+'")',
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: "center",
                  backgroundSize: "cover",
                }}></div>
                <div className="coin__back_large"></div>
                <div className="coin__side_large">
                    <div className="coin__c_large"></div>
                    <div className="coin__c_large"></div>
                    <div className="coin__c_large"></div>
                    <div className="coin__c_large"></div>
                    <div className="coin__c_large"></div>
                    <div className="coin__c_large"></div>
                    <div className="coin__c_large"></div>
                    <div className="coin__c_large"></div>
                    <div className="coin__c_large"></div>
                    <div className="coin__c_large"></div>
                    <div className="coin__c_large"></div>
                    <div className="coin__c_large"></div>
                    <div className="coin__c_large"></div>
                    <div className="coin__c_large"></div>
                    <div className="coin__c_large"></div>
                    <div className="coin__c_large"></div>
                </div>
            </div>
       </div>
    )
  }else {
    return (
        <div className="coin__container" style={{cursor:"pointer"}} onClick={()=>{
          selectBadge(id)
        }}>
            <div className="coin is-slam" style={{
                zIndex: zIndex,
                transform:"rotateX("+displayAngle+"deg)"
            }}>
                <div className="coin__front" style={{
                    backgroundImage: 'url("'+image+'")',
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: "center",
                    backgroundSize: "cover",
                }}></div>
                <div className="coin__back"></div>
                <div className="coin__side">
                    <div className="coin__c"></div>
                    <div className="coin__c"></div>
                    <div className="coin__c"></div>
                    <div className="coin__c"></div>
                    <div className="coin__c"></div>
                    <div className="coin__c"></div>
                    <div className="coin__c"></div>
                    <div className="coin__c"></div>
                    <div className="coin__c"></div>
                    <div className="coin__c"></div>
                    <div className="coin__c"></div>
                    <div className="coin__c"></div>
                    <div className="coin__c"></div>
                    <div className="coin__c"></div>
                    <div className="coin__c"></div>
                    <div className="coin__c"></div>
                </div>
            </div>
       </div>
    )
  }

};
