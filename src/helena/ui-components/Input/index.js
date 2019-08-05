import React from 'react';
import withStyles from '@material-ui/core/styles/withStyles';
import { TextField } from '@material-ui/core';

const grayColor = 'gray';

const customInputStyle = {
  labelRoot: {
    color: `${grayColor} !important`,
    fontWeight: '400',
    fontSize: '13px',
    lineHeight: '1.42857'
  }
};
function CustomInput({ ...props }) {
  const {
    classes,
    error,
    id,
    label,
    value,
    onChange,
    fullWidth,
    required,
    onBlur
  } = props;

  return (
    <TextField
      id={id}
      label={label}
      value={value}
      onChange={onChange}
      fullWidth={fullWidth}
      error={!!error}
      required={required}
      InputLabelProps={{
        className: classes.labelRoot
      }}
      helperText={!!error && error}
      InputProps={{
        onBlur
      }}
    />
  );
}

export default withStyles(customInputStyle)(CustomInput);
