import React from 'react';

export  default ({title, goBack}) => {
  return (
    <div className="nav-card card">
      <div className="row">
        <i className="fas fa-arrow-left" onClick={goBack} />
        <span>{title}</span>
      </div>
    </div>
  )
};
