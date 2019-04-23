import React from 'react';
import { withRouter } from 'react-router-dom';
import Ruler from "./Ruler";
import { Scaler } from "dapparatus";
import BackButton from './BackButton';

const NavCard = ({ title, titleLink, darkMode, history }) => (
  <div className="row">
    <BackButton style={{ position:'absolute', right:10, fontSize:42, top:0, cursor:'pointer', zIndex:1, padding:3 }}>
      <i style={{ color: darkMode ? "#dddddd" : "#000000" }} className="fas fa-times" />
    </BackButton>

    <div style={{ textAlign:"center", width:"100%", fontSize:22, marginBottom:10 }}>
      <Scaler config={{ startZoomAt: 400, origin:"50% 50%", adjustedZoom:1 }}>
        {titleLink ? (
          <a href={titleLink} target="_blank">
            {title}
          </a>
        ) : title}
      </Scaler>
    </div>

    <Ruler />
  </div>
);

export default withRouter(NavCard);
