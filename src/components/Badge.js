// @format
import React from "react";
import Blockies from "react-blockies";
import { Scaler } from "dapparatus";
import { Input, Field, Box } from "rimble-ui";
import styled from "styled-components";

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

export default ({ id, selectBadge, large, badge, showName }) => {
  if (large) {
    return (
      <div>
        <video
          style={{
            width: "100%",
            height: "auto"
          }}
          poster={badge.image}
          width="320"
          height="240"
          controls
        >
          <source src={badge.movie.mp4} type="video/mp4" />
          Your browser does not support the video tag.
        </video>
        <Box mb={4}>
          {badge.name && (
            <Field mb={3} label="Title">
              {badge.name}
            </Field>
          )}
          {badge.year && (
            <Field mb={3} label="Year">
              {badge.year}
            </Field>
          )}
          {badge.director && (
            <Field mb={3} label="Director">
              {badge.director}
            </Field>
          )}
          {badge.producer && (
            <Field mb={3} label="Producer">
              {badge.producer}
            </Field>
          )}
          {badge.cast && (
            <Field mb={3} label="Cast">
              {/*NOTE: We check if badge.cast is an array. Only then we join it.*/}
              {badge.cast.length && badge.cast.join(", ")}
            </Field>
          )}
          {badge.rightholder &&
            badge.rightholder.name && (
              <Field mb={3} label="Rightholder (France)">
                {badge.rightholder.name}
              </Field>
            )}
        </Box>
      </div>
    );
  } else {
    return (
      // NOTE: In Receipt, name is not set and there we don't allow the user to
      // click on the badge.
      <Poster onClick={() => (showName ? selectBadge(badge.id) : null)}>
        <img src={badge.image} />
        {showName ? <Title>{badge.name}</Title> : null}
      </Poster>
    );
  }
};
