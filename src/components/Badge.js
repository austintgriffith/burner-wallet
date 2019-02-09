import React from 'react';
import Blockies from 'react-blockies';
import { Scaler } from "dapparatus";

export  default ({image}) => {

  let angle = 28
  let zIndex = 1

  return (
      <div className="coin__container">
          <div className="coin is-slam" style={{
              zIndex: zIndex,
              transform:"rotateX("+angle+"deg)"
          }}>
              <div className="coin__front" style={{
                  backgroundImage: 'url("'+image+'")',
                  backgroundSize: 50,
                  backgroundRepeat: 'no-repeat'
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
};
