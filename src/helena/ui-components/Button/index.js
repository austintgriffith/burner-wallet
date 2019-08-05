import React from 'react';
import Button from '@material-ui/core/Button';

function RegularButton({ ...props }) {
  return <Button {...props}>{props.children}</Button>;
}

export default RegularButton;
