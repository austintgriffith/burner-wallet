// @format
import React from 'react';
import Blockies from 'react-blockies';
import {Scaler} from 'dapparatus';
import {Input, Field, Box} from 'rimble-ui';

export default ({
  id,
  angle,
  image,
  selectBadge,
  large,
  mp4,
  rightholderName,
  name,
}) => {
  let displayAngle = 28;
  if (angle) {
    displayAngle = angle;
  }
  let zIndex = 1;

  if (large) {
    return (
      <div>
        <video
          style={{
            width: '100%',
            height: 'auto',
          }}
          poster={image}
          width="320"
          height="240"
          controls>
          <source src={mp4} type="video/mp4" />
          Your browser does not support the video tag.
        </video>
        <Box mb={4}>
          <Field mb={3} label="Movie Title">
            {name}
          </Field>
          <Field mb={3} label="Rightholder">
            {rightholderName}
          </Field>
        </Box>
      </div>
    );
  } else {
    return (
      <div className="coin__container" style={{cursor: 'pointer'}}>
        <div
          className="coin is-slam"
          style={{
            zIndex: zIndex,
            transform: 'rotateX(' + displayAngle + 'deg)',
          }}>
          <div
            className="coin__front"
            style={{
              backgroundImage: 'url("' + image + '")',
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'center',
              backgroundSize: 'cover',
            }}
          />
          <div className="coin__back" />
          <div className="coin__side">
            <div className="coin__c" />
            <div className="coin__c" />
            <div className="coin__c" />
            <div className="coin__c" />
            <div className="coin__c" />
            <div className="coin__c" />
            <div className="coin__c" />
            <div className="coin__c" />
            <div className="coin__c" />
            <div className="coin__c" />
            <div className="coin__c" />
            <div className="coin__c" />
            <div className="coin__c" />
            <div className="coin__c" />
            <div className="coin__c" />
            <div className="coin__c" />
          </div>
        </div>
      </div>
    );
  }
};
