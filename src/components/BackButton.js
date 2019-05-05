import React from 'react';
import { withRouter } from 'react-router-dom';

const BackButton = ({ history, children, ...props }) => (
  <div
    onClick={() => {
      
        history.push('/');

    }}
    {...props}
  >
    {children}
  </div>
)

export default withRouter(BackButton);
