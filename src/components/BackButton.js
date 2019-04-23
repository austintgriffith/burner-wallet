import React from 'react';
import { withRouter } from 'react-router-dom';

const BackButton = ({ history, children, ...props }) => (
  <div
    onClick={() => {
      if (history.length > 1) {
        history.goBack();
      } else {
        history.push('/');
      }
    }}
    {...props}
  >
    {children}
  </div>
)

export default withRouter(BackButton);
