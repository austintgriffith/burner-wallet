// @format
import React from 'react';
import Blockies from 'react-blockies';
import {Scaler} from 'dapparatus';
import {Input, Field, Box} from 'rimble-ui';
import styled from 'styled-components';

const Poster = styled.div`
  display: inline-block;
  cursor: pointer;
  border: 1px solid black;
  max-width: 145px;
  img {
    width: 100%;
    height: 210px;
    filter: drop-shadow(0 0 0.15rem black);
  }
`;

const Title = styled.span`
  display: block;
  position: absolute;
  bottom: 0;
  left: 0;
  width: 145px;
  height: 25px;
  background-color: rgba(0, 0, 0, 0.8);
  z-index: 100;
  color: white;
  margin-top: 10px;
  text-align: center;
  text-overflow: ellipsis;
  white-space: nowrap;
  padding: 0 5px 0 5px;
  overflow: hidden;
`;

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
      // NOTE: In Receipt, name is not set and there we don't allow the user to
      // click on the badge.
      <Poster onClick={() => (name ? selectBadge(id) : null)}>
        <img src={image} />
        {name ? <Title>{name}</Title> : null}
      </Poster>
    );
  }
};
