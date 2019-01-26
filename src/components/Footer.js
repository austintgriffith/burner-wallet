import React from 'react';

export default ({alert, changeAlert}) => {
  return (
    <div style={{zIndex:2}} className="footer text-center" onClick={() => changeAlert(null)}>
      <div className={`alert alert-${alert.type}`}>
        {alert.message}
      </div>
    </div>
  )
};
