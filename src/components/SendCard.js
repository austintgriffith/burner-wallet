import React from 'react';

export default ({changeView}) => {
  return (
    <div className="send-card card w-100">
      <div className="row">
        <div className="col p-0">
          Send
        </div>
        <div className="col p-0 text-right icons">
          <span onClick={() => changeView('send_to_address')}>0x</span>
          <i className="fas fa-link" onClick={() => changeView('send_with_link')} />
          <i className="fas fa-camera" onClick={() => changeView('send_by_scan')} />
        </div>
      </div>
    </div>
  )
};
